package com.artifactcomparator.repository;

import com.artifactcomparator.model.ResearcherRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResearcherRequestRepository extends JpaRepository<ResearcherRequest, Long> {
    
    List<ResearcherRequest> findByStatus(ResearcherRequest.RequestStatus status);
    
    List<ResearcherRequest> findByStatusAndUser_Id(ResearcherRequest.RequestStatus status, Long userId);
    
    Optional<ResearcherRequest> findByUser_IdAndStatus(Long userId, ResearcherRequest.RequestStatus status);
    
    List<ResearcherRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);
}

