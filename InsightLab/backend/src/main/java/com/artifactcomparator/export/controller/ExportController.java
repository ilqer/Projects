package com.artifactcomparator.export.controller;

import com.artifactcomparator.export.service.ExportService;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Generic Export Controller
 * Handles export endpoints for any Exportable entity
 */
@Slf4j
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;
    private final StudyRepository studyRepository;

    @GetMapping("/study/{id}/csv")
    @PreAuthorize("hasRole('RESEARCHER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStudyCsv(@PathVariable Long id) {
        log.info("Exporting study {} to CSV", id);
        Study study = studyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Study not found with id: " + id));

        byte[] data = exportService.exportCsv(study);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=study-" + id + ".csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(data);
    }

    @GetMapping("/study/{id}/xlsx")
    @PreAuthorize("hasRole('RESEARCHER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStudyXlsx(@PathVariable Long id) {
        log.info("Exporting study {} to XLSX", id);
        Study study = studyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Study not found with id: " + id));

        byte[] data = exportService.exportXlsx(study);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=study-" + id + ".xlsx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(data);
    }

    @GetMapping("/study/{id}/pdf")
    @PreAuthorize("hasRole('RESEARCHER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStudyPdf(@PathVariable Long id) {
        log.info("Exporting study {} to PDF", id);
        Study study = studyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Study not found with id: " + id));

        byte[] data = exportService.exportPdf(study);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=study-" + id + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(data);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Export service is running");
    }
}

