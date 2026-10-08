package com.complaint.system.controllers;

import com.complaint.system.dao.UserDAO;
import com.complaint.system.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserDAO userDAO;

    // Authorized enterprise client whitelist enforced server-side
    private static final Set<String> ALLOWED_CLIENT_EMAILS = Set.of(
            "customer@client.com",
            "client@client.com",
            "anmol.client@gmail.com",
            "client.acme@gmail.com",
            "client.bmc@gmail.com",
            "client@acmecorp.com"
    );

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> payload) {
        String name = payload.getOrDefault("name", payload.get("fullName"));
        String email = payload.get("email");
        String password = payload.get("password");
        String phone = payload.get("phone");
        String role = payload.getOrDefault("role", "CUSTOMER");

        if (name == null || email == null || phone == null || password == null || password.length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("All fields including Phone are mandatory, and password must be >= 6 chars.");
        }

        email = email.trim().toLowerCase();

        // Server-side whitelist enforcement
        if (!ALLOWED_CLIENT_EMAILS.contains(email) && !email.endsWith("@client.com")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Registration denied: Domain or email not present in corporate whitelist.");
        }

        if (userDAO.findByEmail(email) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Account already registered under this email.");
        }

        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPassword(password);
        newUser.setPhone(phone);
        newUser.setRole(role);

        boolean saved = userDAO.save(newUser);
        if (saved) {
            return ResponseEntity.status(HttpStatus.CREATED).body("Enterprise account created successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to persist user to database.");
        }
    }
}