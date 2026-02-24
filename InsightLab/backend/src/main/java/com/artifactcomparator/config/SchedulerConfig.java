package com.artifactcomparator.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Scheduler yapılandırması
 * Zamanlanmış görevleri aktif eder
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Spring Boot otomatik olarak scheduler'ları yönetir
}