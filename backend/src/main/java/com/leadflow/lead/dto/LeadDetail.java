package com.leadflow.lead.dto;

import java.util.List;

/** A lead plus its full discussion history, newest first. */
public record LeadDetail(
        LeadSummary lead,
        List<DiscussionResponse> discussions
) {
}
