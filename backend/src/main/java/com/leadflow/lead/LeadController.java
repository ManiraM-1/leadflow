package com.leadflow.lead;

import com.leadflow.common.TimeZoneResolver;
import com.leadflow.lead.dto.CreateDiscussionRequest;
import com.leadflow.lead.dto.CreateLeadRequest;
import com.leadflow.lead.dto.DiscussionCreatedResponse;
import com.leadflow.lead.dto.DiscussionResponse;
import com.leadflow.lead.dto.LeadDetail;
import com.leadflow.lead.dto.LeadSummary;
import com.leadflow.lead.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * Every endpoint accepts an optional {@code tz} query parameter (an IANA zone such as
 * {@code Asia/Kolkata}) that decides what "today" means for follow-up flags.
 */
@RestController
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadService leadService;
    private final TimeZoneResolver timeZones;

    public LeadController(LeadService leadService, TimeZoneResolver timeZones) {
        this.leadService = leadService;
        this.timeZones = timeZones;
    }

    /** 200: leads matching the optional status and name filters. */
    @GetMapping
    public List<LeadSummary> listLeads(
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(name = "q", required = false) String nameQuery,
            @RequestParam(required = false) String tz) {
        return leadService.listLeads(status, nameQuery, timeZones.resolve(tz));
    }

    /** 201 + Location header, 400 on validation errors. */
    @PostMapping
    public ResponseEntity<LeadSummary> createLead(
            @Valid @RequestBody CreateLeadRequest request,
            @RequestParam(required = false) String tz) {
        LeadSummary created = leadService.createLead(request, timeZones.resolve(tz));
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** 200: lead with its discussions newest first, 404 if unknown. */
    @GetMapping("/{leadId}")
    public LeadDetail getLead(@PathVariable Long leadId, @RequestParam(required = false) String tz) {
        return leadService.getLead(leadId, timeZones.resolve(tz));
    }

    /** 200: updated lead, 400 on an invalid status, 404 if unknown. */
    @PatchMapping("/{leadId}/status")
    public LeadSummary updateStatus(
            @PathVariable Long leadId,
            @Valid @RequestBody UpdateStatusRequest request,
            @RequestParam(required = false) String tz) {
        return leadService.updateStatus(leadId, request.status(), timeZones.resolve(tz));
    }

    /** 200: updated lead with its follow-up removed ("mark follow-up done"). */
    @DeleteMapping("/{leadId}/follow-up")
    public LeadSummary clearFollowUp(@PathVariable Long leadId, @RequestParam(required = false) String tz) {
        return leadService.clearFollowUp(leadId, timeZones.resolve(tz));
    }

    /** 200: discussions newest first, 404 if the lead is unknown. */
    @GetMapping("/{leadId}/discussions")
    public List<DiscussionResponse> listDiscussions(@PathVariable Long leadId) {
        return leadService.getDiscussions(leadId);
    }

    /** 201: the new discussion plus the updated lead, 400 on validation errors. */
    @PostMapping("/{leadId}/discussions")
    public ResponseEntity<DiscussionCreatedResponse> addDiscussion(
            @PathVariable Long leadId,
            @Valid @RequestBody CreateDiscussionRequest request,
            @RequestParam(required = false) String tz) {
        DiscussionCreatedResponse created = leadService.addDiscussion(leadId, request, timeZones.resolve(tz));
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(created.discussion().id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }
}
