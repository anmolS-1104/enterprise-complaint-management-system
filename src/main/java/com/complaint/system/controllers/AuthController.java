package com.complaint.system.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // EXACT 6 ACCOUNTS ONLY (No wildcards, no random accounts allowed)
    private static final Set<String> ALLOWED_EXACT_EMAILS = Set.of(
            "anmol.client@gmail.com",
            "client.acme@gmail.com",
            "client.bmc@gmail.com",
            "client@acmecorp.com",
            "customer@client.com",
            "client@client.com"
    );

    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String phone = request.get("phone");
        String password = request.get("password");

        // 1. ALL CREDENTIALS COMPULSORY CHECK
        if (name == null || name.trim().isEmpty() ||
                email == null || email.trim().isEmpty() ||
                phone == null || phone.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "REJECTED",
                    "message", "Security Violation: All registration fields are compulsory."
            ));
        }

        // 2. PHONE VALIDATION (Exactly 10 digits)
        if (!phone.trim().matches("^\\d{10}$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "REJECTED",
                    "message", "Validation Error: Phone number must be exactly 10 digits."
            ));
        }

        // 3. PASSWORD LENGTH CHECK
        if (password.trim().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "REJECTED",
                    "message", "Validation Error: Password must be at least 6 characters."
            ));
        }

        // 4. ZERO-TRUST CLOSED WHITELIST CHECK
        String normalizedEmail = email.trim().toLowerCase();
        if (!ALLOWED_EXACT_EMAILS.contains(normalizedEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", "ACCESS_DENIED",
                    "message", "Security Violation: Email is not authorized for registration on this system."
            ));
        }

        // 5. PROCEED TO DATABASE PERSISTENCE
        // userService.saveCustomer(name, normalizedEmail, phone, password);

        return ResponseEntity.ok(Map.of(
                "status", "APPROVED",
                "message", "Account verified and registered successfully."
        ));
    }
}