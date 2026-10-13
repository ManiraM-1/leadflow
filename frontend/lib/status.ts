import type { LeadStatus } from "./types";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
};

/** Badge colours. Red is kept for overdue follow-ups, so "Lost" is neutral grey. */
export const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 ring-blue-600/20",
  CONTACTED: "bg-cyan-50 text-cyan-800 ring-cyan-600/20",
  QUALIFIED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  PROPOSAL_SENT: "bg-amber-50 text-amber-800 ring-amber-600/25",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LOST: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
