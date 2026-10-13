"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage, listLeads } from "@/lib/api";
import type { Lead, LeadStatus } from "@/lib/types";

interface LeadsState {
  /** The filters the current `leads` were loaded for; null before the first load. */
  loadedFor: string | null;
  leads: Lead[];
  error: string | null;
}

/**
 * Loads the lead list for the given filters and keeps it fresh.
 *
 * `upsertLead` patches a single row straight from a mutation response, so the list
 * reflects a change instantly; `reload` then re-fetches in the background so the
 * server's ordering (today's follow-ups first) and filters are applied again.
 */
export function useLeads(status: LeadStatus | null, query: string) {
  const filterKey = `${status ?? "ALL"}|${query.trim()}`;
  const [state, setState] = useState<LeadsState>({ loadedFor: null, leads: [], error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listLeads({ status, query }, controller.signal)
      .then((leads) => setState({ loadedFor: filterKey, leads, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({ ...prev, loadedFor: filterKey, error: errorMessage(error) }));
      });
    return () => controller.abort();
  }, [status, query, filterKey, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const upsertLead = useCallback((lead: Lead) => {
    setState((prev) => {
      const exists = prev.leads.some((l) => l.id === lead.id);
      const leads = exists ? prev.leads.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev.leads];
      return { ...prev, leads };
    });
  }, []);

  return {
    leads: state.leads,
    error: state.error,
    isInitialLoad: state.loadedFor === null,
    isLoading: state.loadedFor !== filterKey,
    reload,
    upsertLead,
  };
}
