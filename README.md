# LeadFlow

A single-screen lead management tool. A sales rep can track leads, log every discussion and set follow-up reminders, without leaving the page.

**Stack:** Spring Boot 3.5 (Java 21) REST API, PostgreSQL (H2 for zero-setup local runs), Next.js 16 + React 19 + Tailwind CSS 4, Docker Compose.

## Features

| Requirement | Where |
| --- | --- |
| Lead list: name, status badge, last discussion note, time since last discussion | `LeadRow.tsx` |
| Filter by status (New / Contacted / Qualified / Proposal Sent / Won / Lost) | `StatusFilter.tsx`, `GET /api/leads?status=` |
| Today's follow-ups pinned at the top | Separate "Today's follow-ups" section; ordering and flags computed by the API |
| Click a lead → dialog (not a page) with full history, newest first | `LeadTimelineDialog.tsx` |
| Add a note with an optional follow-up date & time | `DiscussionForm.tsx`, `POST /api/leads/{id}/discussions` |
| Saving with a follow-up updates the lead and shows in the list immediately | The API returns the updated lead; the row is patched at once, then the list re-fetches |
| Update status from the dialog | `PATCH /api/leads/{id}/status` (optimistic, rolls back on error) |
| Add a lead (name required; company, phone optional; status defaults to New) | `AddLeadDialog.tsx`, `POST /api/leads` |

**Bonus:** search by name · overdue follow-ups highlighted in red · Docker Compose · seed data (8 leads, 17 discussions) · status filters · integration tests for the API.

**Extras:** "Mark done" to clear a follow-up, quick picks for follow-up times ("In 2 hours", "Tomorrow 10 am"), Ctrl+Enter to save a note, relative times that refresh while the page is open, responsive layout down to phone width.

Login was optional in the brief and is not included.

## Quick start (Docker)

Requires Docker with Compose v2.

```bash
docker compose up --build
```

- Web app: http://localhost:3000
- API: http://localhost:8080/api/leads

The first start seeds 8 demo leads with follow-ups due today, overdue and upcoming. All variables have defaults; to change ports or credentials, copy `.env.example` to `.env` and edit it.

To start over with fresh seed data: `docker compose down -v && docker compose up --build`.

## Run without Docker

Requires **JDK 21**, **Maven 3.9+** and **Node.js 20.9+**.

**1. API** (uses an H2 file database in `backend/data/`, no setup needed):

```bash
cd backend
mvn spring-boot:run
```

It runs on http://localhost:8080. To use PostgreSQL instead, set `DB_URL`, `DB_USERNAME` and `DB_PASSWORD` (see `backend/.env.example`).

**2. Web app** (in a second terminal):

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Tests

```bash
cd backend && mvn test
```

`LeadApiTest` runs the real application against an in-memory database through MockMvc. It covers status codes (201, 200, 400, 404), validation messages, newest-first discussions, follow-up propagation, pinning of today's follow-ups, filters and search.

The frontend is checked with `npm run lint` and TypeScript (`npx tsc --noEmit`).

## Configuration

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `DB_URL` | API | `jdbc:h2:file:./data/leadflow` | JDBC URL (Compose points it at PostgreSQL) |
| `DB_USERNAME` / `DB_PASSWORD` | API | `sa` / empty | Database credentials |
| `PORT` | API | `8080` | HTTP port |
| `CORS_ALLOWED_ORIGINS` | API | `http://localhost:3000` | Comma-separated browser origins allowed to call the API |
| `APP_TIMEZONE` | API | `Asia/Kolkata` | Fallback zone for "today" when a request has no `tz` |
| `SEED_DATA` | API | `true` | Seed demo data when the database is empty |
| `NEXT_PUBLIC_API_URL` | Web | `http://localhost:8080` | API base URL as seen from the browser (inlined at build time) |
| `POSTGRES_*`, `API_PORT`, `WEB_PORT` | Compose | see `.env.example` | Database and host ports for `docker compose` |

## API

Base path `/api/leads`. Every endpoint takes an optional `tz` query parameter (IANA zone, e.g. `Asia/Kolkata`). The web app sends the browser's zone, so "today" means the user's today.

| Method & path | Success | Errors |
| --- | --- | --- |
| `GET /api/leads?status=&q=` | `200` leads, today's follow-ups first | `400` unknown status or time zone |
| `POST /api/leads` | `201` + `Location` header | `400` validation |
| `GET /api/leads/{id}` | `200` lead + discussions (newest first) | `404` |
| `PATCH /api/leads/{id}/status` | `200` updated lead | `400`, `404` |
| `DELETE /api/leads/{id}/follow-up` | `200` updated lead (follow-up cleared) | `404` |
| `GET /api/leads/{id}/discussions` | `200` discussions, newest first | `404` |
| `POST /api/leads/{id}/discussions` | `201` `{ discussion, lead }` | `400` validation (e.g. follow-up in the past), `404` |

Errors use the RFC 9457 problem format, with per-field messages for validation failures:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/leads",
  "errors": { "name": "Name is required" }
}
```

Malformed JSON and unknown enum values return `400`, unknown leads `404`, and unexpected failures a generic `500` (details are logged, not leaked). All of it is handled in one place, `GlobalExceptionHandler`.

## Design decisions

- **List ordering lives on the server.** `GET /api/leads` returns follow-ups due today first (soonest first), then overdue ones from earlier days (most overdue first), then everything else by most recent activity. The UI pins the first group in its own section and marks overdue rows in red.
- **"Today" depends on the user's time zone**, so the client sends `tz` and the API computes `followUpDueToday` and `followUpOverdue`. The UI also re-checks overdue status against the clock while the page is open.
- **The last note is denormalised onto the lead** (`lastNote`, `lastDiscussionAt`), updated in the same transaction that saves a discussion. The list is one query instead of one per lead.
- **Adding a discussion returns the updated lead**, so the client patches that row immediately, then re-fetches in the background to re-apply ordering and filters.
- **A discussion without a follow-up keeps the existing follow-up.** Clearing one is an explicit action ("Mark done") so a reminder is never dropped by accident.
- **Time is injected through a `Clock` bean**, so tests and seed data control "now".
- **Native `<dialog>`** for both dialogs: focus trapping, Escape to close and a backdrop without a UI library.
- **Why Spring Boot instead of FastAPI:** Java and Spring Boot are where I'm strongest, and I've shipped production services with them.

## Project structure

```
backend/                     Spring Boot API
  src/main/java/com/leadflow/
    lead/                    Entities, repositories, service, controller
      dto/                   Request/response records
    common/                  Error handling, time-zone resolution
    config/                  CORS, Clock
    seed/                    Demo data loader
  src/test/java/...          API integration tests
frontend/                    Next.js app
  app/                       Layout and the single page
  components/leads/          List, filters, dialogs, forms
  components/ui/             Button, Modal
  hooks/                     useLeads, useNow, useDebouncedValue
  lib/                       API client, types, formatting helpers
docker-compose.yml
```

## Use of AI

I chose the stack and scope; Claude proposed the design and drafted most of the code; I reviewed it, ran it and tested every flow (locally and via Docker Compose) before submitting
