import { isOverdue } from "@/lib/followUp";
import { formatDateTime, timeAgo } from "@/lib/time";
import type { Lead } from "@/lib/types";
import { FollowUpTag } from "./FollowUpTag";
import { StatusBadge } from "./StatusBadge";

interface LeadRowProps {
  lead: Lead;
  now: number;
  onOpen: (leadId: number) => void;
}

export function LeadRow({ lead, now, onOpen }: LeadRowProps) {
  const overdue = isOverdue(lead, now);

  return (
    <li className={overdue ? "border-l-4 border-red-500 bg-red-50/50" : "border-l-4 border-transparent"}>
      <button
        type="button"
        onClick={() => onOpen(lead.id)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none md:grid-cols-[minmax(0,13rem)_8.5rem_minmax(0,1fr)_7rem] md:items-center"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-slate-900">{lead.name}</span>
          {lead.company && <span className="block truncate text-sm text-slate-500">{lead.company}</span>}
        </span>

        <span className="justify-self-end md:justify-self-start">
          <StatusBadge status={lead.status} />
        </span>

        <span className="col-span-2 min-w-0 md:col-span-1">
          {lead.lastNote ? (
            <span className="block truncate text-sm text-slate-700">{lead.lastNote}</span>
          ) : (
            <span className="block text-sm italic text-slate-400">No discussions yet</span>
          )}
          {lead.followUpAt && (
            <span className="mt-1 block">
              <FollowUpTag
                followUpAt={lead.followUpAt}
                overdue={overdue}
                dueToday={lead.followUpDueToday}
                now={now}
              />
            </span>
          )}
        </span>

        <span
          className="col-span-2 text-xs text-slate-500 md:col-span-1 md:text-right md:text-sm"
          title={lead.lastDiscussionAt ? formatDateTime(lead.lastDiscussionAt) : undefined}
        >
          {lead.lastDiscussionAt ? timeAgo(lead.lastDiscussionAt, now) : "—"}
        </span>
      </button>
    </li>
  );
}
