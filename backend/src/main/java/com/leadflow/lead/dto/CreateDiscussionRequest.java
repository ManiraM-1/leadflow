package com.leadflow.lead.dto;

import com.leadflow.lead.Discussion;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Body of {@code POST /api/leads/{id}/discussions}.
 *
 * @param followUpAt optional; when present it becomes the lead's next follow-up
 */
public record CreateDiscussionRequest(
        @NotBlank(message = "Note is required")
        @Size(max = Discussion.NOTE_MAX, message = "Note must be at most {max} characters")
        String note,

        @Future(message = "Follow-up must be in the future")
        Instant followUpAt
) {
}
