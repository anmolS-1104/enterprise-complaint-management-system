package com.complaint.system.controllers;

import com.complaint.system.util.ApiClient;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.stage.Stage;

import java.io.IOException;
import java.net.URL;
import java.net.http.HttpResponse;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

public class RegisterController {

    @FXML private TextField nameField;
    @FXML private TextField emailField;
    @FXML private TextField phoneField;
    @FXML private PasswordField passwordField;
    @FXML private PasswordField confirmPasswordField;
    @FXML private Label messageLabel;

    // Authorized enterprise client emails
    private static final Set<String> ALLOWED_CLIENT_EMAILS = Set.of(
            "customer@client.com",
            "client@client.com",
            "anmol.client@gmail.com",
            "client.acme@gmail.com",
            "client.bmc@gmail.com",
            "client@acmecorp.com"
    );

    @FXML
    protected void handleRegister() {
        String name = nameField.getText().trim();
        String email = emailField.getText().trim().toLowerCase();
        String phone = phoneField.getText().trim();
        String password = passwordField.getText();
        String confirm = confirmPasswordField.getText();

        // Basic & Mandatory Phone Validation
        if (name.isEmpty() || !email.contains("@") || phone.isEmpty() || password.length() < 6) {
            showMessage("Invalid details. All fields including Phone are required & Password > 6 chars.", true);
            return;
        }

        // Whitelist & Enterprise Domain Restriction
        if (!ALLOWED_CLIENT_EMAILS.contains(email) && !email.endsWith("@client.com")) {
            showMessage("Registration restricted: Only authorized enterprise client emails are permitted.", true);
            return;
        }

        if (!password.equals(confirm)) {
            showMessage("Passwords do not match.", true);
            return;
        }

        showMessage("Registering account...", false);

        // Escape JSON quotes
        String safeName = name.replace("\"", "\\\"");
        String safeEmail = email.replace("\"", "\\\"");
        String safePass = password.replace("\"", "\\\"");
        String safePhone = phone.replace("\"", "\\\"");

        String payload = String.format(
                "{\"name\":\"%s\", \"fullName\":\"%s\", \"full_name\":\"%s\", \"email\":\"%s\", \"password\":\"%s\", \"phone\":\"%s\", \"role\":\"CUSTOMER\"}",
                safeName, safeName, safeName, safeEmail, safePass, safePhone
        );

        // Asynchronous REST call targeting /api/auth/register
        CompletableFuture.supplyAsync(() -> {
            try {
                return ApiClient.post("/api/auth/register", payload);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).thenAccept(response -> Platform.runLater(() -> {
            if (response.statusCode() == 200 || response.statusCode() == 201) {
                showMessage("Account created! Redirecting to login...", false);
                handleBackToLogin();
            } else {
                showMessage("Registration failed: " + response.body(), true);
            }
        })).exceptionally(err -> {
            Platform.runLater(() -> {
                showMessage("Connection error: Is backend running?", true);
            });
            return null;
        });
    }

    @FXML
    protected void handleBackToLogin() {
        navigateTo("/login.fxml", "Login - ICRS System", 700, 650);
    }

    private void navigateTo(String fxmlPath, String title, int width, int height) {
        try {
            URL resource = getClass().getResource(fxmlPath);
            if (resource == null) {
                resource = getClass().getResource("/com/complaint/system" + fxmlPath);
            }
            if (resource == null) {
                showMessage("Error: Resource file not found: " + fxmlPath, true);
                return;
            }

            FXMLLoader loader = new FXMLLoader(resource);
            Parent root = loader.load();

            Stage stage = (Stage) nameField.getScene().getWindow();
            stage.setScene(new Scene(root, width, height));
            stage.setTitle(title);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
            showMessage("Error loading screen: " + fxmlPath, true);
        }
    }

    private void showMessage(String text, boolean isError) {
        messageLabel.setText(text);
        messageLabel.setStyle(isError ? "-fx-text-fill: #e74c3c; -fx-font-weight: bold;" : "-fx-text-fill: #2ecc71; -fx-font-weight: bold;");
        messageLabel.setVisible(true);
    }
}