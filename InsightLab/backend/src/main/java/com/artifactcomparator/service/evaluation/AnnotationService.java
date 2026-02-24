package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.AnnotationCreateDTO;
import com.artifactcomparator.dto.evaluation.AnnotationDTO;
import com.artifactcomparator.model.evaluation.EvaluationAnnotation;
import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import com.artifactcomparator.repository.evaluation.EvaluationAnnotationRepository;
import com.artifactcomparator.repository.evaluation.ParticipantTaskAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnotationService {

    private final EvaluationAnnotationRepository annotationRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;

    @Transactional
    public AnnotationDTO saveAnnotation(Long assignmentId, AnnotationCreateDTO dto, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED) {
            throw new IllegalStateException("Cannot modify annotations after submission");
        }

        EvaluationAnnotation annotation = dto.getId() != null
            ? annotationRepository.findById(dto.getId()).orElse(new EvaluationAnnotation())
            : new EvaluationAnnotation();

        annotation.setAssignment(assignment);
        annotation.setArtifactId(dto.getArtifactId());
        annotation.setPanelNumber(dto.getPanelNumber());
        annotation.setAnnotationType(
            dto.getType() != null ? EvaluationAnnotation.AnnotationType.valueOf(dto.getType()) : EvaluationAnnotation.AnnotationType.HIGHLIGHT
        );
        annotation.setContent(dto.getContent());
        annotation.setStartLine(dto.getStartLine());
        annotation.setEndLine(dto.getEndLine());
        annotation.setStartOffset(dto.getStartOffset());
        annotation.setEndOffset(dto.getEndOffset());
        annotation.setColor(dto.getColor());
        annotation.setTags(dto.getTags());
        annotation.setUpdatedAt(LocalDateTime.now());

        return convertToDTO(annotationRepository.save(annotation));
    }

    @Transactional(readOnly = true)
    public List<AnnotationDTO> getAnnotations(Long assignmentId, Long participantId) {
        assignmentRepository.findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        return annotationRepository.findByAssignmentId(assignmentId)
            .stream()
            .map(this::convertToDTO)
            .toList();
    }

    @Transactional
    public void deleteAnnotation(Long annotationId, Long participantId) {
        EvaluationAnnotation annotation = annotationRepository.findById(annotationId)
            .orElseThrow(() -> new IllegalArgumentException("Annotation not found"));

        if (!annotation.getAssignment().getParticipant().getId().equals(participantId)) {
            throw new IllegalStateException("Not authorized");
        }

        if (annotation.getAssignment().getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED) {
            throw new IllegalStateException("Cannot delete annotations after submission");
        }

        annotationRepository.delete(annotation);
    }

    private AnnotationDTO convertToDTO(EvaluationAnnotation annotation) {
        return AnnotationDTO.builder()
            .id(annotation.getId())
            .assignmentId(annotation.getAssignment().getId())
            .artifactId(annotation.getArtifactId())
            .panelNumber(annotation.getPanelNumber())
            .annotationType(annotation.getAnnotationType().name())
            .content(annotation.getContent())
            .startLine(annotation.getStartLine())
            .endLine(annotation.getEndLine())
            .startOffset(annotation.getStartOffset())
            .endOffset(annotation.getEndOffset())
            .color(annotation.getColor())
            .tags(annotation.getTags())
            .createdAt(annotation.getCreatedAt())
            .updatedAt(annotation.getUpdatedAt())
            .build();
    }
}
