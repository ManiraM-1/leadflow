package com.leadflow.lead;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    /** Newest first; the id breaks ties between notes saved in the same instant. */
    List<Discussion> findByLeadIdOrderByCreatedAtDescIdDesc(Long leadId);
}
