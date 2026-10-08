package com.complaint.system.controllers;

import com.complaint.system.dto.LoginRequest;
import com.complaint.system.model.Agent;
import com.complaint.system.model.User;
import com.complaint.system.service.AgentService;
import com.complaint.system.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService = new UserService();
    private final AgentService agentService = new AgentService();

    // Whitelist of authorized customer/client emails permitted to register
    private static final Set<String> ALLOWED_CLIENT_EMAILS = Set.of(
            "customer@client.com",
            "client@client.com",
            "anmol.client@gmail.com",
            "client.acme@gmail.com",
            "client.bmc@gmail.com",
            "client@acmecorp.com"
    );

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        if (request == null || request.get("email") == null || request.get("password") == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email and Password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        String email = request.get("email").trim().toLowerCase();
        String password = request.get("password").trim();
        String fullName = request.getOrDefault("fullName",
                request.getOrDefault("full_name",
                        request.getOrDefault("name", "Enterprise Client")));
        String phone = request.getOrDefault("phone", "").trim();
        String role = request.getOrDefault("role", "CUSTOMER");

        // Mandatory Phone Validation
        if (phone.isEmpty()) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Phone number is mandatory for enterprise registration");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        // Whitelist and Enterprise Domain Restriction
        if (!ALLOWED_CLIENT_EMAILS.contains(email) && !email.endsWith("@client.com")) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access Denied: Registration is restricted to pre-approved enterprise client accounts only.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }

        try {
            User newUser = new User();
            newUser.setFullName(fullName);
            newUser.setEmail(email);
            newUser.setPassword(password);
            newUser.setPhone(phone);
            newUser.setRole(role);

            boolean created = userService.register(newUser);
            if (!created) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "User already exists or registration failed");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }

            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Client registered successfully");
            return ResponseEntity.status(HttpStatus.CREATED).body(successResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Registration error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Email and Password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        String email = request.getEmail().trim();
        String password = request.getPassword().trim();
        String role = (request.getRole() != null && !request.getRole().trim().isEmpty())
                ? request.getRole().trim()
                : "CUSTOMER";

        System.out.println("Processing login attempt for: [" + email + "] with role: [" + role + "]");

        if ("CUSTOMER".equalsIgnoreCase(role)) {
            User user = userService.login(email, password, "CUSTOMER");
            if (user != null) {
                System.out.println("Customer login successful for: " + user.getEmail());
                return ResponseEntity.ok(user);
            }
        } else if ("AGENT".equalsIgnoreCase(role)) {
            Agent agent = agentService.login(email, password);
            if (agent != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", agent.getId());
                response.put("fullName", agent.getFullName());
                response.put("email", email);
                response.put("role", "AGENT");
                response.put("department", agent.getDepartment());
                System.out.println("Agent login successful for: " + email);
                return ResponseEntity.ok(response);
            }
        }

        System.err.println("Authentication failed for user: [" + email + "] with role: [" + role + "]");
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invalid credentials");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }
}