package com.artifactcomparator.scheduler;

import com.artifactcomparator.service.StudyNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Study deadline hatırlatıcıları için zamanlı görev
 * Her gün saat 09:00'da çalışır ve bitimine 1 gün kalan studyler için bildirim gönderir
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudyDeadlineScheduler {

    private final StudyNotificationService studyNotificationService;

    /**
     * Her gün saat 09:00'da çalışır (Türkiye saati)
     * Cron format: saniye dakika saat gün ay haftanın_günü
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Europe/Istanbul")
    public void checkDeadlines() {
        String timestamp = LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        );
        
        log.info("========================================");
        log.info("Starting study deadline check at: {}", timestamp);
        log.info("========================================");
        
        try {
            studyNotificationService.sendDeadlineReminders();
            log.info("Study deadline check completed successfully");
        } catch (Exception e) {
            log.error("Error during study deadline check", e);
        }
        
        log.info("========================================");
    }

    /**
     * İsteğe bağlı: Her 6 saatte bir de çalıştırılabilir
     * İlk 09:00'da, sonra 15:00, 21:00, 03:00'da çalışır
     * Aktif etmek için yukarıdaki @Scheduled'ı comment'leyip bunu aktif edin
     */
    // @Scheduled(cron = "0 0 9,15,21,3 * * *", zone = "Europe/Istanbul")
    public void checkDeadlinesFrequent() {
        checkDeadlines();
    }

    /**
     * Test için: Her 5 dakikada bir çalışır
     * Sadece development ortamında kullanın!
     * Production'da mutlaka comment'leyin veya silin!
     */
    // @Scheduled(cron = "0 */5 * * * *", zone = "Europe/Istanbul")
    public void checkDeadlinesTest() {
        log.info("TEST MODE: Running deadline check (every 5 minutes)");
        studyNotificationService.sendDeadlineReminders();
    }
}