package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.DraftDataDTO;
import com.artifactcomparator.model.evaluation.EvaluationDraft;
import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import com.artifactcomparator.repository.evaluation.EvaluationDraftRepository;
import com.artifactcomparator.repository.evaluation.ParticipantTaskAssignmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DraftService {

    private final EvaluationDraftRepository draftRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;

    @Transactional
    public void saveDraft(Long assignmentId, JsonNode draftData, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED) {
            return; // Don't save drafts after submission
        }

        EvaluationDraft draft = draftRepository.findByAssignmentId(assignmentId)
            .orElse(new EvaluationDraft());

        draft.setAssignment(assignment);
        draft.setDraftData(draftData);
        draft.setLastSavedAt(LocalDateTime.now());

        draftRepository.save(draft);
    }

    @Transactional(readOnly = true)
    public DraftDataDTO getDraft(Long assignmentId, Long participantId) {
        assignmentRepository.findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        return draftRepository.findByAssignmentId(assignmentId)
            .map(this::convertToDTO)
            .orElse(null);
    }

    private DraftDataDTO convertToDTO(EvaluationDraft draft) {
        return DraftDataDTO.builder()
            .id(draft.getId())
            .assignmentId(draft.getAssignment().getId())
            .draftData(draft.getDraftData())
            .lastSavedAt(draft.getLastSavedAt())
            .build();
    }
}
