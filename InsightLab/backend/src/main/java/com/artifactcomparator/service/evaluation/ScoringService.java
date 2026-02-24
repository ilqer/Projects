package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.ScoreEntryDTO;
import com.artifactcomparator.dto.evaluation.ScoreRequestDTO;
import com.artifactcomparator.model.evaluation.CriteriaItem;
import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import com.artifactcomparator.model.evaluation.ScoreEntry;
import com.artifactcomparator.repository.evaluation.CriteriaItemRepository;
import com.artifactcomparator.repository.evaluation.ParticipantTaskAssignmentRepository;
import com.artifactcomparator.repository.evaluation.ScoreEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoringService {

    private final ScoreEntryRepository scoreEntryRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;
    private final CriteriaItemRepository criteriaRepository;

    @Transactional
    public ScoreEntryDTO saveScore(Long assignmentId, ScoreRequestDTO request, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED) {
            throw new IllegalStateException("Cannot modify scores after submission");
        }

        CriteriaItem criteria = criteriaRepository.findById(request.getCriteriaItemId())
            .orElseThrow(() -> new IllegalArgumentException("Criteria item not found"));

        ScoreEntry entry = scoreEntryRepository
            .findByAssignmentIdAndCriteriaItemId(assignmentId, request.getCriteriaItemId())
            .orElse(new ScoreEntry());

        entry.setAssignment(assignment);
        entry.setCriteriaItem(criteria);
        entry.setValue(request.getValue());
        entry.setNotes(request.getNotes());
        entry.setUpdatedAt(LocalDateTime.now());

        return convertToDTO(scoreEntryRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<ScoreEntryDTO> getScores(Long assignmentId, Long participantId) {
        assignmentRepository.findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        return scoreEntryRepository.findByAssignmentId(assignmentId)
            .stream()
            .map(this::convertToDTO)
            .toList();
    }

    private ScoreEntryDTO convertToDTO(ScoreEntry entry) {
        return ScoreEntryDTO.builder()
            .id(entry.getId())
            .assignmentId(entry.getAssignment().getId())
            .criteriaItemId(entry.getCriteriaItem().getId())
            .value(entry.getValue())
            .notes(entry.getNotes())
            .createdAt(entry.getCreatedAt())
            .updatedAt(entry.getUpdatedAt())
            .build();
    }
}
