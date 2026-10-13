package com.leadflow.lead;

import com.leadflow.common.NotFoundException;
import com.leadflow.lead.dto.CreateDiscussionRequest;
import com.leadflow.lead.dto.CreateLeadRequest;
import com.leadflow.lead.dto.DiscussionCreatedResponse;
import com.leadflow.lead.dto.DiscussionResponse;
import com.leadflow.lead.dto.LeadDetail;
import com.leadflow.lead.dto.LeadSummary;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class LeadService {

    private final LeadRepository leadRepository;
    private final DiscussionRepository discussionRepository;
    private final Clock clock;

    public LeadService(LeadRepository leadRepository, DiscussionRepository discussionRepository, Clock clock) {
        this.leadRepository = leadRepository;
        this.discussionRepository = discussionRepository;
        this.clock = clock;
    }

    /**
     * Lists leads, optionally filtered by status and name. Ordering:
     * <ol>
     *   <li>follow-ups due today, soonest first (pinned in the UI)</li>
     *   <li>overdue follow-ups from earlier days, most overdue first</li>
     *   <li>everything else, most recent activity first</li>
     * </ol>
     */
    public List<LeadSummary> listLeads(LeadStatus status, String nameQuery, ZoneId zone) {
        Instant now = clock.instant();
        Specification<Lead> filters = LeadSpecifications.hasStatus(status)
                .and(LeadSpecifications.nameContains(nameQuery));

        return leadRepository.findAll(filters).stream()
                .map(lead -> LeadSummary.from(lead, now, zone))
                .sorted(LeadService::compareForList)
                .toList();
    }

    public LeadDetail getLead(Long leadId, ZoneId zone) {
        Lead lead = findLead(leadId);
        List<DiscussionResponse> discussions = listDiscussions(leadId);
        return new LeadDetail(LeadSummary.from(lead, clock.instant(), zone), discussions);
    }

    public List<DiscussionResponse> getDiscussions(Long leadId) {
        findLead(leadId); // 404 for an unknown lead rather than an empty list
        return listDiscussions(leadId);
    }

    @Transactional
    public LeadSummary createLead(CreateLeadRequest request, ZoneId zone) {
        Instant now = clock.instant();
        Lead lead = new Lead(
                request.name().trim(),
                blankToNull(request.company()),
                blankToNull(request.phone()),
                request.status(),
                now);
        return LeadSummary.from(leadRepository.save(lead), now, zone);
    }

    @Transactional
    public LeadSummary updateStatus(Long leadId, LeadStatus status, ZoneId zone) {
        Instant now = clock.instant();
        Lead lead = findLead(leadId);
        lead.changeStatus(status, now);
        return LeadSummary.from(lead, now, zone);
    }

    @Transactional
    public LeadSummary clearFollowUp(Long leadId, ZoneId zone) {
        Instant now = clock.instant();
        Lead lead = findLead(leadId);
        lead.clearFollowUp(now);
        return LeadSummary.from(lead, now, zone);
    }

    /**
     * Logs a discussion. If it carries a follow-up date, that date becomes the lead's
     * next follow-up. A discussion without one leaves an existing follow-up untouched.
     */
    @Transactional
    public DiscussionCreatedResponse addDiscussion(Long leadId, CreateDiscussionRequest request, ZoneId zone) {
        Instant now = clock.instant();
        Lead lead = findLead(leadId);

        Discussion discussion = discussionRepository.save(
                new Discussion(lead, request.note().trim(), request.followUpAt(), now));
        lead.recordDiscussion(discussion);
        if (request.followUpAt() != null) {
            lead.scheduleFollowUp(request.followUpAt(), now);
        }

        return new DiscussionCreatedResponse(
                DiscussionResponse.from(discussion),
                LeadSummary.from(lead, now, zone));
    }

    private Lead findLead(Long leadId) {
        return leadRepository.findById(leadId)
                .orElseThrow(() -> new NotFoundException("Lead " + leadId + " not found"));
    }

    private List<DiscussionResponse> listDiscussions(Long leadId) {
        return discussionRepository.findByLeadIdOrderByCreatedAtDescIdDesc(leadId).stream()
                .map(DiscussionResponse::from)
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static int compareForList(LeadSummary a, LeadSummary b) {
        int groupA = listGroup(a);
        int groupB = listGroup(b);
        if (groupA != groupB) {
            return Integer.compare(groupA, groupB);
        }
        int byTime = groupA < 2
                ? a.followUpAt().compareTo(b.followUpAt())          // soonest follow-up first
                : lastActivity(b).compareTo(lastActivity(a));       // most recent activity first
        return byTime != 0 ? byTime : Long.compare(b.id(), a.id());
    }

    private static int listGroup(LeadSummary lead) {
        if (lead.followUpDueToday()) {
            return 0;
        }
        return lead.followUpOverdue() ? 1 : 2;
    }

    private static Instant lastActivity(LeadSummary lead) {
        return lead.lastDiscussionAt() != null ? lead.lastDiscussionAt() : lead.createdAt();
    }
}
