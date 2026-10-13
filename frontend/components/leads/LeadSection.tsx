import type { Lead } from "@/lib/types";
import { LeadRow } from "./LeadRow";

interface LeadSectionProps {
  title: string;
  leads: Lead[];
  now: number;
  onOpen: (leadId: number) => void;
  /** "pinned" gets the amber accent used for today's follow-ups. */
  variant?: "pinned" | "default";
}

export function LeadSection({ title, leads, now, onOpen, variant = "default" }: LeadSectionProps) {
  const pinned = variant === "pinned";
  const headingId = `section-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${pinned ? "ring-amber-300" : "ring-slate-200"}`}
    >
      <header
        className={`flex items-center justify-between px-4 py-2.5 ${pinned ? "bg-amber-50" : "border-b border-slate-200"}`}
      >
        <h2 id={headingId} className={`text-sm font-semibold ${pinned ? "text-amber-900" : "text-slate-700"}`}>
          {pinned && <BellIcon />}
          {title}
        </h2>
        <span className={`text-xs font-medium ${pinned ? "text-amber-800" : "text-slate-500"}`}>{leads.length}</span>
      </header>

      <div className="hidden grid-cols-[minmax(0,13rem)_8.5rem_minmax(0,1fr)_7rem] gap-x-4 border-b border-slate-100 py-2 pl-5 pr-4 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
        <span>Lead</span>
        <span>Status</span>
        <span>Last discussion</span>
        <span className="text-right">Last contact</span>
      </div>

      <ul className="divide-y divide-slate-100">
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} now={now} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="mr-1.5 inline size-3.5 -translate-y-px"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <path d="M4 11V7a4 4 0 0 1 8 0v4l1.25 1.5H2.75L4 11Z" />
      <path d="M6.5 13.75a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  );
}
