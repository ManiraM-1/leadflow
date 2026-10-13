package com.leadflow.lead;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:leadflow-test;DB_CLOSE_DELAY=-1",
        "app.seed.enabled=false"
})
@AutoConfigureMockMvc
class LeadApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    /**
     * A UTC offset in which it is currently about noon, so "later today" and "in two days"
     * never cross midnight, whatever time the tests run.
     */
    private String noonZone;

    @BeforeEach
    void setUp() {
        discussionRepository.deleteAll();
        leadRepository.deleteAll();

        int secondsSinceUtcMidnight = LocalTime.now(ZoneOffset.UTC).toSecondOfDay();
        noonZone = ZoneOffset.ofTotalSeconds(12 * 3600 - secondsSinceUtcMidnight).getId();
    }

    // ---- create lead ------------------------------------------------------------------

    @Test
    void createLead_returns201_withTrimmedFieldsAndDefaultStatus() throws Exception {
        mvc.perform(post("/api/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "  Asha Verma  ", "company": "", "phone": "+91 90000 00000"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", notNullValue()))
                .andExpect(jsonPath("$.name").value("Asha Verma"))
                .andExpect(jsonPath("$.company").value(nullValue()))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void createLead_withoutName_returns400WithFieldError() throws Exception {
        mvc.perform(post("/api/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"company": "Acme"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").value("Name is required"));
    }

    @Test
    void createLead_withMalformedJson_returns400() throws Exception {
        mvc.perform(post("/api/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": "))
                .andExpect(status().isBadRequest());
    }

    // ---- read -------------------------------------------------------------------------

    @Test
    void getLead_unknownId_returns404() throws Exception {
        mvc.perform(get("/api/leads/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Lead 999999 not found"));
    }

    @Test
    void getLead_returnsDiscussionsNewestFirst() throws Exception {
        long id = createLead("Neha Gupta", "NEW");
        addDiscussion(id, "First call", null);
        addDiscussion(id, "Second call", null);

        mvc.perform(get("/api/leads/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.discussions", hasSize(2)))
                .andExpect(jsonPath("$.discussions[0].note").value("Second call"))
                .andExpect(jsonPath("$.discussions[1].note").value("First call"));

        mvc.perform(get("/api/leads/{id}/discussions", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].note").value("Second call"));
    }

    // ---- discussions & follow-ups -----------------------------------------------------

    @Test
    void addDiscussion_withFollowUp_updatesLeadAndList() throws Exception {
        long id = createLead("Karthik S", "CONTACTED");
        String followUp = Instant.now().plus(Duration.ofMinutes(30)).truncatedTo(ChronoUnit.SECONDS).toString();

        mvc.perform(post("/api/leads/{id}/discussions", id)
                        .param("tz", noonZone)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\": \"Asked for a callback\", \"followUpAt\": \"" + followUp + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.discussion.note").value("Asked for a callback"))
                .andExpect(jsonPath("$.lead.followUpAt").value(followUp))
                .andExpect(jsonPath("$.lead.followUpDueToday").value(true))
                .andExpect(jsonPath("$.lead.followUpOverdue").value(false))
                .andExpect(jsonPath("$.lead.lastNote").value("Asked for a callback"));

        mvc.perform(get("/api/leads").param("tz", noonZone))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lastNote").value("Asked for a callback"))
                .andExpect(jsonPath("$[0].followUpAt").value(followUp));
    }

    @Test
    void addDiscussion_withPastFollowUp_returns400() throws Exception {
        long id = createLead("Past Follow-up", "NEW");
        String past = Instant.now().minus(Duration.ofHours(1)).toString();

        mvc.perform(post("/api/leads/{id}/discussions", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\": \"Too late\", \"followUpAt\": \"" + past + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.followUpAt").value("Follow-up must be in the future"));
    }

    @Test
    void addDiscussion_blankNote_returns400() throws Exception {
        long id = createLead("Blank Note", "NEW");

        mvc.perform(post("/api/leads/{id}/discussions", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.note").value("Note is required"));
    }

    @Test
    void addDiscussion_unknownLead_returns404() throws Exception {
        mvc.perform(post("/api/leads/999999/discussions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\": \"Hello\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void clearFollowUp_removesIt() throws Exception {
        long id = createLead("Done Today", "QUALIFIED");
        addDiscussion(id, "Call tomorrow", Instant.now().plus(Duration.ofDays(1)).toString());

        mvc.perform(delete("/api/leads/{id}/follow-up", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followUpAt").value(nullValue()))
                .andExpect(jsonPath("$.followUpDueToday").value(false));
    }

    // ---- status -----------------------------------------------------------------------

    @Test
    void updateStatus_persists() throws Exception {
        long id = createLead("Meera Joshi", "PROPOSAL_SENT");

        mvc.perform(patch("/api/leads/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"WON\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WON"));

        mvc.perform(get("/api/leads/{id}", id))
                .andExpect(jsonPath("$.lead.status").value("WON"));
    }

    @Test
    void updateStatus_unknownValue_returns400() throws Exception {
        long id = createLead("Bad Status", "NEW");

        mvc.perform(patch("/api/leads/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"MAYBE\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---- list -------------------------------------------------------------------------

    @Test
    void listLeads_pinsTodaysFollowUpsFirst() throws Exception {
        long dueToday = createLead("Due Today", "CONTACTED");
        addDiscussion(dueToday, "Call later today", Instant.now().plus(Duration.ofMinutes(45)).toString());

        long later = createLead("Due Later", "CONTACTED");
        addDiscussion(later, "Call in two days", Instant.now().plus(Duration.ofDays(2)).toString());

        long recent = createLead("Most Recent Activity", "NEW");
        addDiscussion(recent, "Just spoke to them", null);

        mvc.perform(get("/api/leads").param("tz", noonZone))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].name").value("Due Today"))
                .andExpect(jsonPath("$[0].followUpDueToday").value(true))
                .andExpect(jsonPath("$[1].name").value("Most Recent Activity"))
                .andExpect(jsonPath("$[2].name").value("Due Later"));
    }

    @Test
    void listLeads_filtersByStatusAndName() throws Exception {
        createLead("Ravi Kumar", "QUALIFIED");
        createLead("Ravina Shah", "NEW");
        createLead("Meera Joshi", "NEW");

        mvc.perform(get("/api/leads").param("status", "QUALIFIED"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Ravi Kumar"));

        mvc.perform(get("/api/leads").param("q", "RAVI"))
                .andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(get("/api/leads").param("q", "ravi").param("status", "NEW"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Ravina Shah"));
    }

    @Test
    void listLeads_invalidStatusOrTimeZone_returns400() throws Exception {
        mvc.perform(get("/api/leads").param("status", "MAYBE"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/api/leads").param("tz", "Mars/Olympus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Unknown time zone: Mars/Olympus"));
    }

    // ---- helpers ----------------------------------------------------------------------

    private long createLead(String name, String status) throws Exception {
        MvcResult result = mvc.perform(post("/api/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"status\": \"" + status + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private void addDiscussion(long leadId, String note, String followUpAt) throws Exception {
        String body = followUpAt == null
                ? "{\"note\": \"" + note + "\"}"
                : "{\"note\": \"" + note + "\", \"followUpAt\": \"" + followUpAt + "\"}";
        mvc.perform(post("/api/leads/{id}/discussions", leadId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }
}
