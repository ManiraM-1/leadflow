"use client";

import { useEffect, useState } from "react";
import { clearFollowUp, errorMessage, getLead, updateLeadStatus } from "@/lib/api";
import { isOverdue } from "@/lib/followUp";
import type { DiscussionCreated, Lead, LeadDetail, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DiscussionForm } from "./DiscussionForm";
import { DiscussionTimeline } from "./DiscussionTimeline";
import { FollowUpTag } from "./FollowUpTag";
import { StatusSelect } from "./StatusSelect";

interface LeadTimelineDialogProps {
  /** The lead to show, or null when the dialog is closed. */
  leadId: number | null;
  now: number | null;
  onClose: () => void;
  /** Called with the updated lead after any change, so the list can reflect it. */
  onLeadChanged: (lead: Lead) => void;
}

export function LeadTimelineDialog({ leadId, now, onClose, onLeadChanged }: LeadTimelineDialogProps) {
  return (
    <Modal open={leadId !== null} onClose={onClose} labelledBy="lead-dialog-title">
      {leadId !== null && now !== null && (
        // key: a different lead gets fresh state
        <LeadTimeline key={leadId} leadId={leadId} now={now} onClose={onClose} onLeadChanged={onLeadChanged} />
      )}
    </Modal>
  );
}

interface LeadTimelineProps {
  leadId: number;
  now: number;
  onClose: () => void;
  onLeadChanged: (lead: Lead) => void;
}

function LeadTimeline({ leadId, now, onClose, onLeadChanged }: LeadTimelineProps) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [clearingFollowUp, setClearingFollowUp] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getLead(leadId, controller.signal)
      .then(setDetail)
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error));
      });
    return () => controller.abort();
  }, [leadId]);

  function applyLead(lead: Lead) {
    setDetail((current) => (current ? { ...current, lead } : current));
    onLeadChanged(lead);
  }

  async function handleStatusChange(status: LeadStatus) {
    if (!detail) return;
    const previous = detail.lead;
    // Optimistic: show the new status right away, roll back if the API refuses.
    setDetail({ ...detail, lead: { ...previous, status } });
    setActionError(null);
    setSavingStatus(true);
    try {
      applyLead(await updateLeadStatus(leadId, status));
    } catch (error) {
      setDetail((current) => (current ? { ...current, lead: previous } : current));
      setActionError(`Couldn't update status: ${errorMessage(error)}`);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleClearFollowUp() {
    setActionError(null);
    setClearingFollowUp(true);
    try {
      applyLead(await clearFollowUp(leadId));
    } catch (error) {
      setActionError(`Couldn't clear the follow-up: ${errorMessage(error)}`);
    } finally {
      setClearingFollowUp(false);
    }
  }

  function handleDiscussionSaved({ discussion, lead }: DiscussionCreated) {
    setDetail((current) => (current ? { lead, discussions: [discussion, ...current.discussions] } : current));
    onLeadChanged(lead);
  }

  const lead = detail?.lead;

  return (
    <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
      {/* Header: who, status, follow-up */}
      <div className="border-b border-slate-200 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="lead-dialog-title" className="truncate text-lg font-semibold text-slate-900">
              {lead?.name ?? "Loading…"}
            </h2>
            {lead && (lead.company || lead.phone) && (
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {lead.company}
                {lead.company && lead.phone && " · "}
                {lead.phone && (
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="hover:text-slate-900 hover:underline">
                    {lead.phone}
                  </a>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lead && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="lead-status" className="text-sm text-slate-500">
                Status
              </label>
              <StatusSelect id="lead-status" value={lead.status} onChange={handleStatusChange} disabled={savingStatus} />
            </div>
            {lead.followUpAt ? (
              <div className="flex items-center gap-2">
                <FollowUpTag
                  followUpAt={lead.followUpAt}
                  overdue={isOverdue(lead, now)}
                  dueToday={lead.followUpDueToday}
                  now={now}
                />
                <Button variant="ghost" size="sm" onClick={handleClearFollowUp} disabled={clearingFollowUp}>
                  {clearingFollowUp ? "Clearing…" : "Mark done"}
                </Button>
              </div>
            ) : (
              <span className="text-sm text-slate-400">No follow-up scheduled</span>
            )}
          </div>
        )}
        {actionError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {actionError}
          </p>
        )}
      </div>

      {/* History, newest first */}
      <div className="min-h-32 flex-1 overflow-y-auto px-5 py-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Discussion history</h3>
        {loadError ? (
          <p role="alert" className="text-sm text-red-600">
            {loadError}
          </p>
        ) : detail ? (
          <DiscussionTimeline discussions={detail.discussions} now={now} />
        ) : (
          <TimelineSkeleton />
        )}
      </div>

      {/* New discussion */}
      {detail && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <DiscussionForm leadId={leadId} now={now} onSaved={handleDiscussionSaved} />
        </div>
      )}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
