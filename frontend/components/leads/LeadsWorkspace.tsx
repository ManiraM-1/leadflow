"use client";

import { useCallback, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLeads } from "@/hooks/useLeads";
import { useNow } from "@/hooks/useNow";
import type { Lead, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { LeadSection } from "./LeadSection";
import { LeadTimelineDialog } from "./LeadTimelineDialog";
import { SearchInput } from "./SearchInput";
import { StatusFilter } from "./StatusFilter";

/** The single LeadFlow screen: list, filters and search. Owns all page-level state. */
export function LeadsWorkspace() {
  const [status, setStatus] = useState<LeadStatus | null>(null);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search, 300);

  const { leads, error, isInitialLoad, isLoading, reload, upsertLead } = useLeads(status, query);
  const now = useNow();

  const [openLeadId, setOpenLeadId] = useState<number | null>(null);

  // Patch the row at once, then re-fetch so ordering and filters are re-applied.
  const handleLeadChanged = useCallback(
    (lead: Lead) => {
      upsertLead(lead);
      reload();
    },
    [upsertLead, reload],
  );

  const dueToday = leads.filter((lead) => lead.followUpDueToday);
  const others = leads.filter((lead) => !lead.followUpDueToday);
  const isFiltered = status !== null || query.trim() !== "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">LeadFlow</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isInitialLoad
              ? "Loading leads…"
              : `${leads.length} ${leads.length === 1 ? "lead" : "leads"} · ${dueToday.length} follow-up${dueToday.length === 1 ? "" : "s"} due today`}
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <SearchInput value={search} onChange={setSearch} />
        <StatusFilter value={status} onChange={setStatus} />
      </div>

      {error && (
        <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      <div className={`mt-6 flex flex-col gap-6 transition-opacity ${isLoading && !isInitialLoad ? "opacity-60" : ""}`}>
        {isInitialLoad || now === null ? (
          <ListSkeleton />
        ) : leads.length === 0 ? (
          !error && <EmptyState filtered={isFiltered} />
        ) : (
          <>
            {dueToday.length > 0 && (
              <LeadSection title="Today's follow-ups" variant="pinned" leads={dueToday} now={now} onOpen={setOpenLeadId} />
            )}
            {others.length > 0 && (
              <LeadSection
                title={dueToday.length > 0 ? "Other leads" : "All leads"}
                leads={others}
                now={now}
                onOpen={setOpenLeadId}
              />
            )}
          </>
        )}
      </div>

      <LeadTimelineDialog
        leadId={openLeadId}
        now={now}
        onClose={() => setOpenLeadId(null)}
        onLeadChanged={handleLeadChanged}
      />
    </main>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200">
      <p className="font-medium text-slate-900">{filtered ? "No leads match these filters" : "No leads yet"}</p>
      <p className="mt-1 text-sm text-slate-500">
        {filtered ? "Try another status or search term." : "Add your first lead to start tracking discussions."}
      </p>
    </div>
  );
}
