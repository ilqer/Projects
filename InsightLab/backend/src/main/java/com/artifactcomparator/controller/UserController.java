package com.artifactcomparator.controller;

import com.artifactcomparator.dto.ErrorResponse;
import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.dto.UserDTO;
import com.artifactcomparator.model.User;
import com.artifactcomparator.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            UserDTO user = userService.getUserByUsername(username);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        logger.info("Update request for user ID: {}", id);
        try {
            UserDTO updatedUser = userService.updateUser(
                    id,
                    request.getEmail(),
                    request.getFullName(),
                    request.getCurrentPassword(),
                    request.getNewPassword(),
                    request.getGeminiApiKey()
            );
            logger.info("User updated successfully: {}", id);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Update failed for user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        logger.info("Delete request for user ID: {}", id);
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        } catch (Exception e) {
            logger.error("Delete failed for user {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/researcher-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getResearcherRequests() {
        return ResponseEntity.ok(userService.getPendingResearcherRequests());
    }

    @PostMapping("/{id}/approve-researcher")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveResearcher(@PathVariable Long id) {
        try {
            UserDTO updated = userService.approveResearcherRequest(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject-researcher")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectResearcher(@PathVariable Long id) {
        try {
            UserDTO updated = userService.rejectResearcherRequest(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/admin-update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminUpdateUser(@PathVariable Long id, @Valid @RequestBody AdminUpdateUserRequest request) {
        try {
            UserDTO updatedUser = userService.adminUpdateUser(
                    id,
                    request.getUsername(),
                    request.getEmail(),
                    request.getFullName(),
                    request.getRole(),
                    request.getNewPassword()
            );
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    // User deactivates their own account
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateAccount(@PathVariable Long id) {
        try {
            UserDTO updated = userService.deactivateAccount(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // Get pending reactivation requests (Admin only)
    @GetMapping("/reactivation-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getReactivationRequests() {
        return ResponseEntity.ok(userService.getPendingReactivationRequests());
    }

    // Admin approves reactivation
    @PostMapping("/{id}/approve-reactivation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveReactivation(@PathVariable Long id) {
        try {
            UserDTO updated = userService.approveReactivation(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // Admin rejects reactivation
    @PostMapping("/{id}/reject-reactivation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectReactivation(@PathVariable Long id) {
        try {
            UserDTO updated = userService.rejectReactivation(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    // Admin toggles user active status directly
    @PostMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, @RequestBody ToggleStatusRequest request) {
        try {
            UserDTO updated = userService.adminToggleUserStatus(id, request.isActive());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateUserRequest {
    private String email;
    private String fullName;
    private String currentPassword;
    private String newPassword;
    private String geminiApiKey;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class AdminUpdateUserRequest {
    private String username;
    private String email;
    private String fullName;
    private User.Role role;
    private String newPassword;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ToggleStatusRequest {
    private boolean active;
}