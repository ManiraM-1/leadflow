package com.leadflow.lead;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** One logged conversation with a lead, optionally with the follow-up it scheduled. */
@Entity
@Table(name = "discussions",
        indexes = @Index(name = "idx_discussions_lead_created", columnList = "lead_id, created_at"))
public class Discussion {

    public static final int NOTE_MAX = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(nullable = false, length = NOTE_MAX)
    private String note;

    @Column(name = "follow_up_at")
    private Instant followUpAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Discussion() {
        // for JPA
    }

    public Discussion(Lead lead, String note, Instant followUpAt, Instant createdAt) {
        this.lead = lead;
        this.note = note;
        this.followUpAt = followUpAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Lead getLead() {
        return lead;
    }

    public String getNote() {
        return note;
    }

    public Instant getFollowUpAt() {
        return followUpAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
