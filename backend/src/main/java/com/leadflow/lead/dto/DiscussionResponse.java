package com.leadflow.lead.dto;

import com.leadflow.lead.Discussion;

import java.time.Instant;

public record DiscussionResponse(
        Long id,
        String note,
        Instant followUpAt,
        Instant createdAt
) {
    public static DiscussionResponse from(Discussion discussion) {
        return new DiscussionResponse(
                discussion.getId(),
                discussion.getNote(),
                discussion.getFollowUpAt(),
                discussion.getCreatedAt());
    }
}
