package com.artifactcomparator.config;

import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Create default admin user
        if (!userRepository.existsByUsername("efe")) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("efe");
            admin.setEmail("efe@admin.com");
            admin.setPassword(passwordEncoder.encode("efeefe123"));
            admin.setFullName("Efe Admin");
            admin.setUsername("admin");
            admin.setEmail("admin@admin.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Admin");
            admin.setRole(User.Role.ADMIN);
            admin.setActive(true);
            admin.setEmailVerified(true);
            userRepository.save(admin);
            logger.info("Default admin user created - Username: efe, Password: efeefe123");
            logger.info("Default admin user created - Username: admin, Password: admin123");
        } else {
            logger.info("ℹ️ Admin user 'efe' already exists. Skipping creation.");
        }

        // Create default researcher user
        if (!userRepository.existsByUsername("res")) {
            User researcher = new User();
            researcher.setUsername("res");
            researcher.setEmail("res@researcher.com");
            researcher.setPassword(passwordEncoder.encode("res123"));
            researcher.setFullName("Default Researcher");
            researcher.setRole(User.Role.RESEARCHER);
            researcher.setActive(true);
            researcher.setEmailVerified(true);
            userRepository.save(researcher);
            logger.info("Default researcher user created - Username: res, Password: res123");
        } else {
            logger.info("ℹ️ Researcher user 'res' already exists. Skipping creation.");
        }

        // Create default reviewer user
        if (!userRepository.existsByUsername("rev")) {
            User reviewer = new User();
            reviewer.setUsername("rev");
            reviewer.setEmail("rev@reviewer.com");
            reviewer.setPassword(passwordEncoder.encode("rev123"));
            reviewer.setFullName("Default Reviewer");
            reviewer.setRole(User.Role.REVIEWER);
            reviewer.setActive(true);
            reviewer.setEmailVerified(true);
            userRepository.save(reviewer);
            logger.info("Default reviewer user created - Username: rev, Password: rev123");
        } else {
            logger.info("ℹ️ Reviewer user 'rev' already exists. Skipping creation.");
        }

        // Create default participant user
        if (!userRepository.existsByUsername("par")) {
            User participant = new User();
            participant.setUsername("par");
            participant.setEmail("par@participant.com");
            participant.setPassword(passwordEncoder.encode("par123"));
            participant.setFullName("Default Participant");
            participant.setRole(User.Role.PARTICIPANT);
            participant.setActive(true);
            participant.setEmailVerified(true);
            userRepository.save(participant);
            logger.info("Default participant user created - Username: par, Password: par123");
        } else {
            logger.info("ℹ️ Participant user 'par' already exists. Skipping creation.");
            logger.info("ℹ️ Admin user 'admin' already exists. Skipping creation.");
        }
    }
}
}