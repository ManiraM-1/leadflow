export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** A lead as returned by GET /api/leads. Timestamps are ISO-8601 strings in UTC. */
export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  followUpAt: string | null;
  /** Follow-up falls on today's date in the browser's time zone (computed by the API). */
  followUpDueToday: boolean;
  /** Follow-up time had already passed when the API answered. */
  followUpOverdue: boolean;
  lastNote: string | null;
  lastDiscussionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  id: number;
  note: string;
  followUpAt: string | null;
  createdAt: string;
}

export interface LeadDetail {
  lead: Lead;
  /** Newest first. */
  discussions: Discussion[];
}

export interface DiscussionCreated {
  discussion: Discussion;
  lead: Lead;
}

export interface NewLeadInput {
  name: string;
  company?: string;
  phone?: string;
  status?: LeadStatus;
}

export interface NewDiscussionInput {
  note: string;
  /** ISO-8601 instant, or omitted for no follow-up. */
  followUpAt?: string;
}

export interface LeadFilters {
  status: LeadStatus | null;
  query: string;
}
