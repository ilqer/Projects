package com.artifactcomparator.dto;

import com.artifactcomparator.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30)
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    private User.Role role;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private Boolean reactivationRequested;
    private Boolean reactivationRejected;
    private Boolean researcherRequested;
    private Boolean researcherRejected;
    private String geminiApiKey; // Only for researchers
    private boolean emailVerified;
    
    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setActive(user.getActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setReactivationRequested(user.getReactivationRequested());
        dto.setReactivationRejected(user.getReactivationRejected());
        dto.setGeminiApiKey(user.getGeminiApiKey());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setEmailVerified(user.isEmailVerified());
        // researcherRequested and researcherRejected will be set separately by UserService
        return dto;
    }
}
