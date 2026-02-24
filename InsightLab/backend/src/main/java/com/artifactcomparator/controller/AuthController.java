package com.artifactcomparator.controller;

import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.dto.UserDTO;
import com.artifactcomparator.model.User;
import com.artifactcomparator.security.JwtUtil;
import com.artifactcomparator.service.AuthService;
import com.artifactcomparator.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody com.artifactcomparator.dto.RegisterRequest request) {
        logger.info("Registration attempt for username: {}", request.getUsername());
        try {
            User createdUser = authService.register(request);
            
            // If RESEARCHER role was requested, create a researcher request
            if (request.getRole() == User.Role.RESEARCHER) {
                userService.createResearcherRequest(createdUser);
            }
            
            UserDTO userDTO = UserDTO.fromEntity(createdUser);

            logger.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(userDTO);
        } catch (Exception e) {
            logger.error("Registration failed for {}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody com.artifactcomparator.dto.LoginRequest request) {
        logger.info("Login attempt for username: {}", request.getUsername());
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            UserDTO userDTO = userService.getUserByUsername(request.getUsername());

            if (!userDTO.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("Email not verified"));
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            
            userService.updateLastLogin(request.getUsername());
            String token = jwtUtil.generateToken(userDetails);

            logger.info("Login successful: {}", request.getUsername());
            // Return user data regardless of active status - frontend will handle it
            return ResponseEntity.ok(new com.artifactcomparator.dto.AuthResponse(token, userDTO));
        } catch (Exception e) {
            logger.error("Login failed for {}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid username or password"));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            // Frontend sends { "email": "...", "code": "..." }
            authService.verifyEmail(request.get("email"), request.get("code"));
            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resend(@RequestBody Map<String, String> request) {
        authService.resendCode(request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Code sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            authService.forgotPassword(request.get("email"));
            return ResponseEntity.ok(Map.of("message", "Password reset code sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            authService.resetPassword(
                request.get("email"),
                request.get("code"),
                request.get("newPassword")
            );
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // User requests reactivation (no auth needed since account is deactivated)
    @PostMapping("/request-reactivation")
    public ResponseEntity<?> requestReactivation(@Valid @RequestBody ReactivationRequest request) {
        logger.info("Reactivation request for username: {}", request.getUsername());
        try {
            // First validate the password
            if (!userService.validatePassword(request.getUsername(), request.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid credentials"));
            }
            
            UserDTO updated = userService.requestReactivation(request.getUsername());
            logger.info("Reactivation requested successfully: {}", request.getUsername());
            return ResponseEntity.ok(new MessageResponse("Reactivation request sent to admin"));
        } catch (Exception e) {
            logger.error("Reactivation request failed for {}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ErrorResponse {
    private String message;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ReactivationRequest {
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Password is required")
    private String password;
}
