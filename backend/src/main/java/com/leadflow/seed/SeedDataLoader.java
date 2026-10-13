package com.leadflow.seed;

import com.leadflow.lead.Discussion;
import com.leadflow.lead.DiscussionRepository;
import com.leadflow.lead.Lead;
import com.leadflow.lead.LeadRepository;
import com.leadflow.lead.LeadStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Inserts 8 demo leads with discussions when the database is empty.
 *
 * <p>Dates are relative to the moment the app starts, so the demo always has follow-ups
 * due today, overdue ones and upcoming ones. Disable with {@code SEED_DATA=false}.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class SeedDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedDataLoader.class);

    private final LeadRepository leadRepository;
    private final DiscussionRepository discussionRepository;
    private final Clock clock;
    private final ZoneId zone;

    private Instant now;
    private LocalDate today;

    public SeedDataLoader(LeadRepository leadRepository,
                          DiscussionRepository discussionRepository,
                          Clock clock,
                          @Value("${app.timezone}") String timeZone) {
        this.leadRepository = leadRepository;
        this.discussionRepository = discussionRepository;
        this.clock = clock;
        this.zone = ZoneId.of(timeZone);
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (leadRepository.count() > 0) {
            log.info("Seed skipped: database already has leads");
            return;
        }
        now = clock.instant();
        today = LocalDate.ofInstant(now, zone);

        Lead ananya = lead("Ananya Rao", "Rao Family Office", "+91 98450 12345", LeadStatus.QUALIFIED, daysAgo(9, 10, 15));
        note(ananya, "Inbound from the website. Manages the family's investments across three generations and wants consolidated reporting.", daysAgo(9, 10, 20), null);
        note(ananya, "Discovery call. Roughly ₹40 Cr, mostly FDs and real estate. Interested in a full portfolio review.", daysAgo(6, 15, 0), null);
        note(ananya, "Shared a sample portfolio report. She wants her CFO on the next call.", daysAgo(2, 12, 30), laterToday(120));

        Lead vikram = lead("Vikram Mehta", "Mehta Textiles", "+91 99001 23456", LeadStatus.CONTACTED, daysAgo(5, 11, 0));
        note(vikram, "Met at the SME expo. Looking for somewhere to park surplus business cash.", daysAgo(5, 11, 5), null);
        note(vikram, "Called, but he was travelling. Asked me to call back this evening.", daysAgo(1, 17, 40), laterToday(300));

        lead("Priya Nair", null, "+91 90080 55667", LeadStatus.NEW, now.minus(Duration.ofHours(1)));

        Lead rahul = lead("Rahul Sharma", "Sharma & Associates", "+91 98860 44321", LeadStatus.PROPOSAL_SENT, daysAgo(14, 9, 30));
        note(rahul, "Referral from Sneha. His CA firm wants advisory support for about 25 HNI clients.", daysAgo(14, 9, 45), null);
        note(rahul, "Demo done. Liked goal-based planning; asked about per-client pricing.", daysAgo(10, 16, 0), null);
        note(rahul, "Proposal sent: per-client monthly pricing with a 3-month pilot.", daysAgo(5, 14, 10), daysAgo(2, 11, 0));

        Lead sneha = lead("Sneha Kulkarni", "Kulkarni Dental Clinic", "+91 97401 98765", LeadStatus.WON, daysAgo(30, 10, 0));
        note(sneha, "Wants retirement planning for herself and her two partners.", daysAgo(30, 10, 10), null);
        note(sneha, "Risk profiling done for all three partners.", daysAgo(22, 12, 0), null);
        note(sneha, "Proposal accepted. Onboarding scheduled.", daysAgo(15, 18, 0), null);
        note(sneha, "Onboarded. Asked for a quarterly review cadence.", daysAgo(12, 11, 30), null);

        Lead arjun = lead("Arjun Reddy", "Tech Mahal Pvt Ltd", "+91 91234 56780", LeadStatus.LOST, daysAgo(20, 13, 0));
        note(arjun, "Startup founder exploring ESOP tax planning.", daysAgo(20, 13, 15), null);
        note(arjun, "Went with their CA's in-house advisory. Worth revisiting next year.", daysAgo(8, 10, 45), null);

        Lead kavya = lead("Kavya Iyer", "Iyer Exports", "+91 98801 11223", LeadStatus.CONTACTED, daysAgo(4, 15, 0));
        note(kavya, "Exporter with USD receivables; wants advice on hedging and investing the surplus.", daysAgo(3, 15, 20), tomorrowAt(11, 0));

        Lead faizal = lead("Mohammed Faizal", "Faizal Logistics", "+91 99459 87654", LeadStatus.QUALIFIED, daysAgo(12, 9, 0));
        note(faizal, "Fleet owner with 40 trucks. Planning to fund a second business line.", daysAgo(12, 9, 20), null);
        note(faizal, "Shared a cash-flow projection template. Waiting for his numbers.", daysAgo(4, 17, 0), daysAgo(1, 16, 0));

        log.info("Seeded {} demo leads", leadRepository.count());
    }

    private Lead lead(String name, String company, String phone, LeadStatus status, Instant createdAt) {
        return leadRepository.save(new Lead(name, company, phone, status, createdAt));
    }

    private void note(Lead lead, String text, Instant at, Instant followUpAt) {
        Discussion discussion = discussionRepository.save(new Discussion(lead, text, followUpAt, at));
        lead.recordDiscussion(discussion);
        if (followUpAt != null) {
            lead.scheduleFollowUp(followUpAt, at);
        }
    }

    private Instant daysAgo(int days, int hour, int minute) {
        return today.minusDays(days).atTime(hour, minute).atZone(zone).toInstant();
    }

    private Instant tomorrowAt(int hour, int minute) {
        return today.plusDays(1).atTime(hour, minute).atZone(zone).toInstant();
    }

    /** A time later today, capped at 23:59 so it never spills into tomorrow. */
    private Instant laterToday(int minutesFromNow) {
        Instant candidate = now.plus(Duration.ofMinutes(minutesFromNow));
        Instant endOfDay = today.atTime(LocalTime.of(23, 59)).atZone(zone).toInstant();
        return candidate.isAfter(endOfDay) ? endOfDay : candidate;
    }
}
