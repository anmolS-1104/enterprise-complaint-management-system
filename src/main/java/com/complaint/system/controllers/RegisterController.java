package com.complaint.system.controllers;

import javafx.application.Platform;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Set;

public class RegisterController {

    @FXML private TextField nameField;
    @FXML private TextField emailField;
    @FXML private TextField phoneField;
    @FXML private PasswordField passwordField;
    @FXML private Button registerButton;
    @FXML private Label statusLabel;

    // CLOSED WHITELIST - STRICT ZERO-TRUST
    private static final Set<String> ALLOWED_EXACT_EMAILS = Set.of(
            "anmol.client@gmail.com",
            "client.acme@gmail.com",
            "client.bmc@gmail.com",
            "client@acmecorp.com",
            "customer@client.com",
            "client@client.com"
    );

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @FXML
    public void initialize() {
        if (statusLabel != null) {
            statusLabel.setVisible(false);
        }
    }

    @FXML
    private void handleRegister(ActionEvent event) {
        String name = nameField.getText() == null ? "" : nameField.getText().trim();
        String email = emailField.getText() == null ? "" : emailField.getText().trim().toLowerCase();
        String phone = phoneField.getText() == null ? "" : phoneField.getText().trim();
        String password = passwordField.getText() == null ? "" : passwordField.getText().trim();

        // 1. COMPULSORY FIELDS CHECK
        if (name.isEmpty() || email.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            displayStatus("Security Error: All fields are compulsory.", true);
            return;
        }

        // 2. PHONE DIGITS CHECK
        if (!phone.matches("^\\d{10}$")) {
            displayStatus("Validation Error: Phone must be exactly 10 numeric digits.", true);
            return;
        }

        // 3. PASSWORD LENGTH CHECK
        if (password.length() < 6) {
            displayStatus("Validation Error: Password must be at least 6 characters.", true);
            return;
        }

        // 4. CLOSED WHITELIST REJECTION
        if (!ALLOWED_EXACT_EMAILS.contains(email)) {
            displayStatus("Access Denied: Email not authorized for registration.", true);
            return;
        }

        // 5. CALL SPRING BOOT API ASYNCHRONOUSLY
        displayStatus("Validating and registering...", false);
        registerButton.setDisable(true);

        String jsonPayload = String.format(
                "{\"name\":\"%s\",\"email\":\"%s\",\"phone\":\"%s\",\"password\":\"%s\"}",
                escapeJson(name), escapeJson(email), escapeJson(phone), escapeJson(password)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:8080/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> Platform.runLater(() -> {
                    registerButton.setDisable(false);
                    if (response.statusCode() == 200) {
                        displayStatus("Registration successful! Redirecting to login...", false);
                        navigateToLogin(event);
                    } else if (response.statusCode() == 403) {
                        displayStatus("Access Denied: Email is not authorized.", true);
                    } else if (response.statusCode() == 409) {
                        displayStatus("Account already exists. Please log in.", true);
                    } else {
                        displayStatus("Registration failed. Please check your credentials.", true);
                    }
                }))
                .exceptionally(ex -> {
                    Platform.runLater(() -> {
                        registerButton.setDisable(false);
                        displayStatus("Server error: Ensure Spring Boot backend is active.", true);
                    });
                    return null;
                });
    }

    @FXML
    private void handleBackToLogin(ActionEvent event) {
        navigateToLogin(event);
    }

    private void navigateToLogin(ActionEvent event) {
        try {
            URL resource = getClass().getResource("/CompanyCMS_Login.fxml");
            if (resource == null) {
                resource = getClass().getResource("/com/complaint/system/CompanyCMS_Login.fxml");
            }
            if (resource == null) {
                displayStatus("Login view template not found.", true);
                return;
            }

            FXMLLoader loader = new FXMLLoader(resource);
            Parent root = loader.load();
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            stage.setScene(new Scene(root, 1180, 760));
            stage.setTitle("CompanyCMS - Intelligent Complaint Resolution System");
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            displayStatus("Failed to open Login screen.", true);
        }
    }

    private void displayStatus(String message, boolean isError) {
        if (statusLabel != null) {
            statusLabel.setText(message);
            statusLabel.setStyle(isError ? "-fx-text-fill: #f43f5e;" : "-fx-text-fill: #4fd1c5;");
            statusLabel.setVisible(true);
        }
    }

    private String escapeJson(String raw) {
        return raw.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}