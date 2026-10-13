import type {
  DiscussionCreated,
  Lead,
  LeadDetail,
  LeadFilters,
  LeadStatus,
  NewDiscussionInput,
  NewLeadInput,
} from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** An error response from the API, carrying its problem-detail fields. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Field name -> message, present on 400 validation errors. */
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The browser's IANA time zone, so the API knows what "today" means for this user. */
function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

async function request<T>(path: string, init: RequestInit = {}, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  url.searchParams.set("tz", browserTimeZone());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(`Can't reach the API at ${API_URL}. Is the backend running?`, 0);
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new ApiError(
      problem?.detail ?? `Request failed (${response.status})`,
      response.status,
      problem?.errors ?? {},
    );
  }
  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function listLeads(filters: LeadFilters, signal?: AbortSignal): Promise<Lead[]> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.query.trim()) params.q = filters.query.trim();
  return request<Lead[]>("/api/leads", { signal }, params);
}

export function getLead(id: number, signal?: AbortSignal): Promise<LeadDetail> {
  return request<LeadDetail>(`/api/leads/${id}`, { signal });
}

export function createLead(input: NewLeadInput): Promise<Lead> {
  return request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(input) });
}

export function updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  return request<Lead>(`/api/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function clearFollowUp(id: number): Promise<Lead> {
  return request<Lead>(`/api/leads/${id}/follow-up`, { method: "DELETE" });
}

export function addDiscussion(leadId: number, input: NewDiscussionInput): Promise<DiscussionCreated> {
  return request<DiscussionCreated>(`/api/leads/${leadId}/discussions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
