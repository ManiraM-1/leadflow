package com.leadflow.lead.dto;

import com.leadflow.lead.Lead;
import com.leadflow.lead.LeadStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * A lead as shown in the list.
 *
 * <p>The two follow-up flags are computed on the server for the caller's time zone, so
 * "today" and "overdue" mean the same thing everywhere in the app.
 *
 * @param followUpDueToday the follow-up falls on today's date in the caller's time zone
 * @param followUpOverdue  the follow-up time has already passed
 */
public record LeadSummary(
        Long id,
        String name,
        String company,
        String phone,
        LeadStatus status,
        Instant followUpAt,
        boolean followUpDueToday,
        boolean followUpOverdue,
        String lastNote,
        Instant lastDiscussionAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static LeadSummary from(Lead lead, Instant now, ZoneId zone) {
        Instant followUpAt = lead.getFollowUpAt();
        LocalDate today = LocalDate.ofInstant(now, zone);
        boolean dueToday = followUpAt != null && LocalDate.ofInstant(followUpAt, zone).equals(today);
        boolean overdue = followUpAt != null && followUpAt.isBefore(now);

        return new LeadSummary(
                lead.getId(),
                lead.getName(),
                lead.getCompany(),
                lead.getPhone(),
                lead.getStatus(),
                followUpAt,
                dueToday,
                overdue,
                lead.getLastNote(),
                lead.getLastDiscussionAt(),
                lead.getCreatedAt(),
                lead.getUpdatedAt());
    }
}
