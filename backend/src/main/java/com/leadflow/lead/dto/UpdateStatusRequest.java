package com.leadflow.lead.dto;

import com.leadflow.lead.LeadStatus;
import jakarta.validation.constraints.NotNull;

/** Body of {@code PATCH /api/leads/{id}/status}. */
public record UpdateStatusRequest(
        @NotNull(message = "Status is required")
        LeadStatus status
) {
}
