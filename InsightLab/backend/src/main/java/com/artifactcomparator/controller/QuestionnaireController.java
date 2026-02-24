package com.artifactcomparator.controller;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.service.QuestionnaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/questionnaires")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class QuestionnaireController {
    
    private final QuestionnaireService questionnaireService;
    private final ObjectMapper objectMapper;
    
    @PostMapping
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionnaireResponseDTO> createQuestionnaire(
            @Valid @RequestBody QuestionnaireCreateDTO dto) {
        try {
            QuestionnaireResponseDTO created = questionnaireService.createQuestionnaire(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionnaireResponseDTO> updateQuestionnaire(
            @PathVariable Long id,
            @Valid @RequestBody QuestionnaireUpdateDTO dto) {
        try {
            QuestionnaireResponseDTO updated = questionnaireService.updateQuestionnaire(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PostMapping("/import")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<?> importQuestionnaire(@RequestParam("file") MultipartFile file) {
        try {
            // Read and parse JSON file
            QuestionnaireImportDTO importDTO = objectMapper.readValue(
                    file.getInputStream(), 
                    QuestionnaireImportDTO.class
            );
            
            QuestionnaireResponseDTO imported = questionnaireService.importQuestionnaire(importDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(imported);
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid JSON file: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Validation error: " + e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/import/json")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<?> importQuestionnaireFromJson(
            @Valid @RequestBody QuestionnaireImportDTO importDTO) {
        try {
            QuestionnaireResponseDTO imported = questionnaireService.importQuestionnaire(importDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(imported);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Validation error: " + e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionnaireResponseDTO> getQuestionnaireById(@PathVariable Long id) {
        try {
            QuestionnaireResponseDTO questionnaire = questionnaireService.getQuestionnaireById(id);
            return ResponseEntity.ok(questionnaire);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/my-questionnaires")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<QuestionnaireListDTO>> getMyQuestionnaires() {
        List<QuestionnaireListDTO> questionnaires = questionnaireService.getMyQuestionnaires();
        return ResponseEntity.ok(questionnaires);
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<QuestionnaireListDTO>> getActiveQuestionnaires() {
        List<QuestionnaireListDTO> questionnaires = questionnaireService.getActiveQuestionnaires();
        return ResponseEntity.ok(questionnaires);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<Void> deleteQuestionnaire(@PathVariable Long id) {
        try {
            questionnaireService.deleteQuestionnaire(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionnaireResponseDTO> deactivateQuestionnaire(@PathVariable Long id) {
        try {
            QuestionnaireResponseDTO deactivated = questionnaireService.deactivateQuestionnaire(id);
            return ResponseEntity.ok(deactivated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionnaireResponseDTO> activateQuestionnaire(@PathVariable Long id) {
        try {
            QuestionnaireResponseDTO activated = questionnaireService.activateQuestionnaire(id);
            return ResponseEntity.ok(activated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}