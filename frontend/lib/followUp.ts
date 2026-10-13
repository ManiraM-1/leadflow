import type { Lead } from "./types";

/**
 * The API flags overdue follow-ups when it answers; this also catches ones that have
 * passed since, while the page has been open.
 */
export function isOverdue(lead: Lead, now: number | null): boolean {
  if (!lead.followUpAt) return false;
  if (lead.followUpOverdue) return true;
  return now !== null && Date.parse(lead.followUpAt) < now;
}
