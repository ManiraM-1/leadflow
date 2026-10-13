package com.leadflow.lead.dto;

/**
 * Response to logging a discussion. It includes the updated lead so the client can
 * refresh the list row (last note, follow-up) without another round trip.
 */
public record DiscussionCreatedResponse(
        DiscussionResponse discussion,
        LeadSummary lead
) {
}
