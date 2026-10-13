package com.leadflow.lead;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A sales lead.
 *
 * <p>{@code lastNote} and {@code lastDiscussionAt} are denormalised copies of the most
 * recent discussion. They are updated in the same transaction that saves a discussion,
 * so the lead list can be served from one query instead of one query per lead.
 */
@Entity
@Table(name = "leads")
public class Lead {

    public static final int NAME_MAX = 120;
    public static final int COMPANY_MAX = 120;
    public static final int PHONE_MAX = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = NAME_MAX)
    private String name;

    @Column(length = COMPANY_MAX)
    private String company;

    @Column(length = PHONE_MAX)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeadStatus status;

    @Column(name = "follow_up_at")
    private Instant followUpAt;

    @Column(name = "last_note", length = Discussion.NOTE_MAX)
    private String lastNote;

    @Column(name = "last_discussion_at")
    private Instant lastDiscussionAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Lead() {
        // for JPA
    }

    public Lead(String name, String company, String phone, LeadStatus status, Instant createdAt) {
        this.name = name;
        this.company = company;
        this.phone = phone;
        this.status = status == null ? LeadStatus.NEW : status;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    public void changeStatus(LeadStatus newStatus, Instant now) {
        this.status = newStatus;
        this.updatedAt = now;
    }

    public void scheduleFollowUp(Instant followUpAt, Instant now) {
        this.followUpAt = followUpAt;
        this.updatedAt = now;
    }

    public void clearFollowUp(Instant now) {
        this.followUpAt = null;
        this.updatedAt = now;
    }

    /** Keeps the denormalised "last discussion" fields pointing at the newest note. */
    public void recordDiscussion(Discussion discussion) {
        Instant at = discussion.getCreatedAt();
        if (lastDiscussionAt == null || !at.isBefore(lastDiscussionAt)) {
            this.lastNote = discussion.getNote();
            this.lastDiscussionAt = at;
        }
        if (updatedAt == null || at.isAfter(updatedAt)) {
            this.updatedAt = at;
        }
    }

    /** Time of the latest activity: the last discussion, or creation if there is none. */
    public Instant lastActivityAt() {
        return lastDiscussionAt != null ? lastDiscussionAt : createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCompany() {
        return company;
    }

    public String getPhone() {
        return phone;
    }

    public LeadStatus getStatus() {
        return status;
    }

    public Instant getFollowUpAt() {
        return followUpAt;
    }

    public String getLastNote() {
        return lastNote;
    }

    public Instant getLastDiscussionAt() {
        return lastDiscussionAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
