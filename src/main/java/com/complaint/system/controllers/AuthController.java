package com.complaint.system.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    // Strictly 6 whitelisted enterprise corporate emails (No @gmail.com)
    private static final Set<String> WHITELISTED_CUSTOMER_EMAILS = Set.of(
            "anmol@client.company.com",
            "client@acmecorp.com",
            "client@bmcsoftware.com",
            "sam@acmecorp.com",
            "customer@client.com",
            "client@client.com"
    );

    // 4 Pre-provisioned agent desks (Direct sign-in only)
    private static final Map<String, String> PRE_PROVISIONED_AGENTS = Map.of(
            "finance@agent.company.com", "finance123",
            "tech@agent.company.com", "tech123",
            "care@agent.company.com", "care123",
            "logistics@agent.company.com", "logistics123"
    );

    // In-memory customer credentials store (Email -> Password)
    private static final Map<String, String> REGISTERED_CUSTOMERS = new ConcurrentHashMap<>(Map.of(
            "anmol@client.company.com", "client123",
            "client@acmecorp.com", "client123",
            "client@bmcsoftware.com", "client123",
            "sam@acmecorp.com", "client123",
            "customer@client.com", "client123",
            "client@client.com", "client123"
    ));

    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");

    // Static inner DTO to prevent missing external model/entity dependency errors
    public static class UserRequest {
        private String name;
        private String email;
        private String phone;
        private String password;

        public UserRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(@RequestBody UserRequest user) {
        if (user == null || user.getEmail() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is required"));
        }

        String normalizedEmail = user.getEmail().trim().toLowerCase();

        // 1. Zero-Trust Whitelist Verification
        if (!WHITELISTED_CUSTOMER_EMAILS.contains(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "ACCESS_DENIED: Unauthorized Corporate Account"));
        }

        // 2. Strict Form Validation (Name present, 10-digit phone, password length >= 6)
        if (user.getName() == null || user.getName().trim().isEmpty() ||
                user.getPhone() == null || !PHONE_PATTERN.matcher(user.getPhone().trim()).matches() ||
                user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "VALIDATION_FAILED: Name required, phone must be exactly 10 digits, and password >= 6 chars."));
        }

        // 3. Save to in-memory store
        REGISTERED_CUSTOMERS.put(normalizedEmail, user.getPassword());

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Corporate account registered successfully.",
                "email", normalizedEmail
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email and password are required"));
        }

        String normalizedEmail = email.trim().toLowerCase();

        // 1. Support Agent Check
        if (PRE_PROVISIONED_AGENTS.containsKey(normalizedEmail)) {
            if (PRE_PROVISIONED_AGENTS.get(normalizedEmail).equals(password)) {
                return ResponseEntity.ok(Map.of(
                        "role", "SUPPORT_AGENT",
                        "email", normalizedEmail,
                        "status", "AUTHENTICATED"
                ));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "INVALID_CREDENTIALS"));
        }

        // 2. Whitelisted Customer Check
        if (WHITELISTED_CUSTOMER_EMAILS.contains(normalizedEmail)) {
            String savedPassword = REGISTERED_CUSTOMERS.get(normalizedEmail);
            if (savedPassword != null && savedPassword.equals(password)) {
                return ResponseEntity.ok(Map.of(
                        "role", "CUSTOMER",
                        "email", normalizedEmail,
                        "status", "AUTHENTICATED"
                ));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "INVALID_CREDENTIALS"));
        }

        // 3. Reject any unauthorized email
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "ACCESS_DENIED: Unauthorized Corporate Account"));
    }
}