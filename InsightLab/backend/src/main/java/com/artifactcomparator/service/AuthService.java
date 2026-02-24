package com.artifactcomparator.service;

import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.UserRepository;
import com.artifactcomparator.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // 1. REGISTER
    public User register(RegisterRequest req) {
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setRole(req.getRole() != null ? req.getRole() : User.Role.PARTICIPANT);
        
        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(code);
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(15));
        user.setEmailVerified(false);

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), code);
        return user;
    }

    // 2. VERIFY
    public void verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified()) {
            return; // Already verified
        }

        if (user.getVerificationExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code expired");
        }

        if (user.getVerificationCode().equals(code)) {
            user.setEmailVerified(true);
            user.setVerificationCode(null); // Clear code
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid code");
        }
    }

    // 3. RESEND
    public void resendCode(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        if (user.isEmailVerified()) return;

        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(code);
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), code);
    }

    // 4. FORGOT PASSWORD - Request reset code
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setPasswordResetToken(code);
        user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), code);
    }

    // 5. RESET PASSWORD - Verify code and set new password
    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPasswordResetToken() == null) {
            throw new RuntimeException("No password reset request found");
        }

        if (user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset code expired");
        }

        if (!user.getPasswordResetToken().equals(code)) {
            throw new RuntimeException("Invalid reset code");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);
    }
}
