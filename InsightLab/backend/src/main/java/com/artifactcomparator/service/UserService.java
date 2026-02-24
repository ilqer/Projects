package com.artifactcomparator.service;

import com.artifactcomparator.dto.UserDTO;
import com.artifactcomparator.model.ResearcherRequest;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.ResearcherRequestRepository;
import com.artifactcomparator.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResearcherRequestRepository researcherRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    UserDTO dto = UserDTO.fromEntity(user);
                    enrichWithResearcherRequestStatus(dto, user.getId());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDTO dto = UserDTO.fromEntity(user);
        enrichWithResearcherRequestStatus(dto, user.getId());
        return dto;
    }

    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDTO dto = UserDTO.fromEntity(user);
        enrichWithResearcherRequestStatus(dto, user.getId());
        return dto;
    }
    
    private void enrichWithResearcherRequestStatus(UserDTO dto, Long userId) {
        // Check for pending request
        boolean hasPending = researcherRequestRepository
                .findByUser_IdAndStatus(userId, ResearcherRequest.RequestStatus.PENDING)
                .isPresent();
        dto.setResearcherRequested(hasPending);
        
        // Check for rejected request (most recent one)
        List<ResearcherRequest> userRequests = researcherRequestRepository
                .findByUser_IdOrderByCreatedAtDesc(userId);
        boolean hasRejected = userRequests.stream()
                .anyMatch(req -> req.getStatus() == ResearcherRequest.RequestStatus.REJECTED);
        dto.setResearcherRejected(hasRejected);
    }

    @Transactional
    public ResearcherRequest createResearcherRequest(User user) {
        // Check if there's already a pending request for this user
        researcherRequestRepository.findByUser_IdAndStatus(user.getId(), ResearcherRequest.RequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw new RuntimeException("A pending researcher request already exists for this user");
                });
        
        ResearcherRequest request = new ResearcherRequest();
        request.setUser(user);
        request.setStatus(ResearcherRequest.RequestStatus.PENDING);
        return researcherRequestRepository.save(request);
    }

    public List<UserDTO> getPendingResearcherRequests() {
        List<ResearcherRequest> pendingRequests = researcherRequestRepository.findByStatus(ResearcherRequest.RequestStatus.PENDING);
        return pendingRequests.stream()
                .map(ResearcherRequest::getUser)
                .map(user -> {
                    UserDTO dto = UserDTO.fromEntity(user);
                    enrichWithResearcherRequestStatus(dto, user.getId());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO approveResearcherRequest(Long userId) {
        ResearcherRequest request = researcherRequestRepository.findByUser_IdAndStatus(userId, ResearcherRequest.RequestStatus.PENDING)
                .orElseThrow(() -> new RuntimeException("No pending researcher request for this user"));
        
        User user = request.getUser();
        user.setRole(User.Role.RESEARCHER);
        userRepository.save(user);
        
        request.setStatus(ResearcherRequest.RequestStatus.APPROVED);
        researcherRequestRepository.save(request);
        
        UserDTO dto = UserDTO.fromEntity(user);
        enrichWithResearcherRequestStatus(dto, user.getId());
        return dto;
    }

    @Transactional
    public UserDTO rejectResearcherRequest(Long userId) {
        ResearcherRequest request = researcherRequestRepository.findByUser_IdAndStatus(userId, ResearcherRequest.RequestStatus.PENDING)
                .orElseThrow(() -> new RuntimeException("No pending researcher request for this user"));
        
        // Keep role as is (likely PARTICIPANT), mark request as rejected
        request.setStatus(ResearcherRequest.RequestStatus.REJECTED);
        researcherRequestRepository.save(request);
        
        UserDTO dto = UserDTO.fromEntity(request.getUser());
        enrichWithResearcherRequestStatus(dto, request.getUser().getId());
        return dto;
    }

    @Transactional
    public UserDTO updateUser(Long id,String email, String fullName, String currentPassword, String newPassword, String geminiApiKey) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(email);
        }

        if (fullName != null && !fullName.isEmpty()) {
            user.setFullName(fullName);
        }

        if (newPassword != null && !newPassword.isEmpty()) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        // Only researchers can set/update Gemini API key
        // Allow empty string to clear the API key, or a non-empty value to set it
        if (geminiApiKey != null && user.getRole() == User.Role.RESEARCHER) {
            // If empty string is sent, clear the API key; otherwise set it
            user.setGeminiApiKey(geminiApiKey.trim().isEmpty() ? null : geminiApiKey.trim());
        } else if (geminiApiKey != null && user.getRole() != User.Role.RESEARCHER) {
            // Non-researchers trying to set API key - silently ignore (don't throw error)
            // This allows the update to proceed for other fields
        }

        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }

    @Transactional
    public UserDTO adminUpdateUser(Long id, String username, String email, String fullName, User.Role role, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(username);
        }

        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(email);
        }

        if (fullName != null && !fullName.isEmpty()) {
            user.setFullName(fullName);
        }

        if (role != null) {
            user.setRole(role);
        }

        if (newPassword != null && !newPassword.isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        User updatedUser = userRepository.save(user);
        return UserDTO.fromEntity(updatedUser);
    }


    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public boolean validatePassword(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return passwordEncoder.matches(password, user.getPassword());
    }

    // User self-deactivation
    @Transactional
    public UserDTO deactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.getActive()) {
            throw new RuntimeException("Account is already deactivated");
        }
        
        user.setActive(false);
        user.setReactivationRequested(false);
        user.setReactivationRejected(false);
        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    // User requests reactivation
    @Transactional
    public UserDTO requestReactivation(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getActive()) {
            throw new RuntimeException("Account is already active");
        }
        
        if (Boolean.TRUE.equals(user.getReactivationRequested())) {
            throw new RuntimeException("Reactivation request already pending");
        }
        
        user.setReactivationRequested(true);
        user.setReactivationRejected(false);
        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    // Admin gets pending reactivation requests
    public List<UserDTO> getPendingReactivationRequests() {
        return userRepository.findByReactivationRequestedTrue().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // Admin approves reactivation
    @Transactional
    public UserDTO approveReactivation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!Boolean.TRUE.equals(user.getReactivationRequested())) {
            throw new RuntimeException("No pending reactivation request for this user");
        }
        
        user.setActive(true);
        user.setReactivationRequested(false);
        user.setReactivationRejected(false);
        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    // Admin rejects reactivation
    @Transactional
    public UserDTO rejectReactivation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!Boolean.TRUE.equals(user.getReactivationRequested())) {
            throw new RuntimeException("No pending reactivation request for this user");
        }
        
        user.setReactivationRequested(false);
        user.setReactivationRejected(true);
        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    // Admin activates/deactivates user directly
    @Transactional
    public UserDTO adminToggleUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(active);
        if (active) {
            // Clear any pending requests when admin activates
            user.setReactivationRequested(false);
            user.setReactivationRejected(false);
        }
        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    public void updateLastLogin(String username) {
        User u = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        u.setLastLoginAt(LocalDateTime.now());
        userRepository.save(u);
    }
}