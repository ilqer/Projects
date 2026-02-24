package com.artifactcomparator.model;

import com.artifactcomparator.common.Exportable;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "studies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Study implements Exportable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Study title is required")
    @Size(min = 3, max = 255, message = "Study title must be between 3 and 255 characters")
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotBlank(message = "Study objective is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String objective;
    
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyStatus status = StudyStatus.DRAFT;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id", nullable = false)
    private User researcher;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Additional fields from the form
    @Column(name = "comparison_type")
    private String comparisonType;
    
    @Column(name = "blinded_mode")
    private Boolean blindedMode = false;
    
    @Column(name = "max_participants")
    private Integer maxParticipants;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum StudyStatus {
        DRAFT,
        ACTIVE,
        PAUSED,
        COMPLETED,
        CANCELLED,
        ARCHIVED
    }

    @Override
    public Map<String, String> toExportMap() {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("ID", String.valueOf(this.id));
        data.put("Title", this.title != null ? this.title : "N/A");
        data.put("Description", this.description != null ? this.description : "N/A");
        data.put("Objective", this.objective != null ? this.objective : "N/A");
        data.put("Start Date", this.startDate != null ? this.startDate.toString() : "N/A");
        data.put("End Date", this.endDate != null ? this.endDate.toString() : "N/A");
        data.put("Status", this.status != null ? this.status.toString() : "N/A");
        data.put("Comparison Type", this.comparisonType != null ? this.comparisonType : "N/A");
        data.put("Max Participants", this.maxParticipants != null ? String.valueOf(this.maxParticipants) : "N/A");
        data.put("Blinded Mode", this.blindedMode != null ? String.valueOf(this.blindedMode) : "false");
        data.put("Researcher", this.researcher != null ? this.researcher.getFullName() : "N/A");
        data.put("Created At", this.createdAt != null ? this.createdAt.toString() : "N/A");
        data.put("Updated At", this.updatedAt != null ? this.updatedAt.toString() : "N/A");
        return data;
    }
}
