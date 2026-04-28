# Bolna Lead Qualifier

An end-to-end AI voice calling app that automatically qualifies inbound B2B sales leads using Bolna Voice AI, a Next.js web app, and Supabase.

A sales user submits a lead through a web form, the backend instantly triggers an outbound voice call via Bolna, an AI agent runs a structured qualification conversation in English or Hindi, the call result is pushed back through a webhook, and the dashboard updates in real time with the qualification outcome.

Live deployment: https://sales-agent-pied.vercel.app

---

## Table of Contents

1. [Problem and Use Case](#1-problem-and-use-case)
2. [How It Works](#2-how-it-works)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [Setup](#6-setup)
7. [Environment Variables](#7-environment-variables)
8. [Supabase Schema](#8-supabase-schema)
9. [Bolna Agent Configuration](#9-bolna-agent-configuration)
10. [API Reference](#10-api-reference)
11. [Running Locally](#11-running-locally)
12. [Deployment](#12-deployment)
13. [Testing the Flow](#13-testing-the-flow)
14. [Troubleshooting](#14-troubleshooting)
15. [Outcome Metrics](#15-outcome-metrics)

---

## 1. Problem and Use Case

Inbound B2B sales teams waste a large amount of time manually calling new leads to qualify them before handing them off to a specialist. Most of these calls are repetitive: confirming use case, role, team size, budget, timeline, and demo interest.

This project automates that first qualification touch using a Voice AI agent. A sales user only enters lead details in a web form. The system then:

- Calls the lead automatically.
- Runs a structured 1–2 minute qualification interview in English or Hindi.
- Decides if the lead is qualified based on use case clarity, budget, and timeline.
- Stores the result back into a CRM-style dashboard.

The outcome is a faster, consistent, and 24x7 lead qualification pipeline that sales reps can review at a glance.

---

## 2. How It Works

End-to-end flow:

```
User (sales rep)
    │
    ▼
Web form (Next.js)
    │  POST /api/create-call
    ▼
Supabase: insert lead (status = pending)
    │
    ▼
Bolna API: trigger outbound call
    │
    ▼
Bolna Voice Agent calls the lead
    │  (English / Hindi)
    │  6 qualification questions
    ▼
Bolna custom tool: save_lead_result
    │  (POST → /api/webhook/bolna)
    ▼
Supabase: lead updated
    (status, qualified, summary)
    │
    ▼
Dashboard auto-refreshes every 3s
```

Two channels update the lead:

- Custom function tool `save_lead_result` (primary, fired by the agent at the end of the call).
- Bolna Analytics webhook (backup, fired automatically as the call status changes).

---

## 3. Tech Stack

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 16 (App Router) with React 19         |
| Language    | TypeScript                                    |
| Styling     | Tailwind CSS v4                               |
| Database    | Supabase (Postgres) using `@supabase/supabase-js` |
| Voice AI    | Bolna Voice AI (custom function tool + analytics webhook) |
| Hosting     | Vercel                                        |

---

## 4. Architecture

The backend uses Next.js API routes:

- `POST /api/create-call` — creates a lead and triggers a Bolna outbound call.
- `POST /api/webhook/bolna` — receives the qualification result and updates the lead.
- `GET /api/leads` — returns all leads for the dashboard.

The frontend has two pages:

- `/` — lead intake form.
- `/dashboard` — auto-refreshing dashboard.

The webhook intentionally only updates fields that are present in the payload, so the deterministic Analytics webhook does not overwrite the richer values produced by the function tool.

---

## 5. Project Structure

```
app_v1/
├─ app/
│  ├─ page.tsx                    # Lead intake form
│  ├─ dashboard/
│  │  └─ page.tsx                 # Real-time dashboard
│  ├─ api/
│  │  ├─ create-call/route.ts     # Create lead + trigger Bolna call
│  │  ├─ leads/route.ts           # GET all leads
│  │  └─ webhook/bolna/route.ts   # Receive Bolna qualification result
│  ├─ lib/
│  │  ├─ supabase-server.ts       # Supabase server client
│  │  └─ lead-store.ts            # Lead CRUD helpers
│  └─ layout.tsx                  # Root layout
├─ public/
├─ .env.example
├─ package.json
└─ README.md
```

---

## 6. Setup

```bash
git clone <your-repo-url>
cd app_v1
npm install
cp .env.example .env
```

Then fill in `.env` (see next section).

---

## 7. Environment Variables

Create a `.env` file in `app_v1/`:

```
BOLNA_API_KEY=your_bolna_api_key
BOLNA_AGENT_ID=your_bolna_agent_id
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=optional_but_recommended_for_server_routes
```

Notes:

- `BOLNA_API_KEY` and `BOLNA_AGENT_ID` are server-only. They do not need the `NEXT_PUBLIC_` prefix because they are only used inside server routes.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe to expose publicly.
- `SUPABASE_SERVICE_ROLE_KEY` is preferred on the server. If present, it is used automatically.

---

## 8. Supabase Schema

Create a `leads` table in Supabase with this schema:

```sql
create table public.leads (
  id           uuid primary key,
  name         text not null,
  phone        text not null,
  company      text not null,
  call_status  text not null check (call_status in ('pending','in_progress','completed','failed')),
  qualified    boolean,
  summary      text not null default '',
  created_at   timestamptz not null default now()
);

create index leads_phone_idx on public.leads (phone);
create index leads_created_at_idx on public.leads (created_at desc);
```

If you use the Supabase publishable (anon) key, make sure RLS is either disabled on `leads` or has policies that allow inserts and updates from the server route.

---

## 9. Bolna Agent Configuration

### 9.1 Agent prompt

The agent is a polite, multilingual (English + Hindi) B2B qualification specialist. It asks one question at a time, handles silence, generates a 1–2 line summary, and decides qualification using these rules:

- Use case must be clear and relevant.
- Budget must be a meaningful positive amount.
- Timeline must be 3 months or less.

A copy of the full agent prompt is stored in the project (or your Bolna agent), and the most important section is the post-call logic, which forces the tool call before the closing message.

### 9.2 Custom tool: `save_lead_result`

Configure this custom function tool inside your Bolna agent:

```json
{
  "name": "save_lead_result",
  "description": "ALWAYS call this function at the end of the qualification call, before the closing sentence. Use it for both completed and failed calls. Send phone, qualified, summary and status.",
  "pre_call_message": "Saving the lead result now.",
  "parameters": {
    "type": "object",
    "required": ["phone", "qualified", "summary", "status"],
    "properties": {
      "lead_id": {
        "type": "string",
        "description": "App lead id if available. Never use call_sid."
      },
      "phone": {
        "type": "string",
        "description": "Lead phone in E.164 format, e.g. +918289094077"
      },
      "qualified": {
        "type": "boolean",
        "description": "Whether the lead is qualified"
      },
      "summary": {
        "type": "string",
        "description": "1-2 line call summary"
      },
      "status": {
        "type": "string",
        "enum": ["completed", "failed"],
        "description": "Call outcome status"
      }
    }
  },
  "key": "custom_task",
  "value": {
    "method": "POST",
    "param": {
      "lead_id": "%(lead_id)s",
      "phone": "%(phone)s",
      "qualified": "%(qualified)s",
      "summary": "%(summary)s",
      "status": "%(status)s"
    },
    "url": "https://YOUR-DEPLOYED-DOMAIN/api/webhook/bolna",
    "api_token": null,
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

### 9.3 Analytics webhook (recommended)

In the Bolna agent's Analytics tab, set:

```
Push all execution data to webhook → https://YOUR-DEPLOYED-DOMAIN/api/webhook/bolna
```

This is a deterministic, non-LLM-based delivery channel. The webhook endpoint only updates fields that are explicitly present, so the Analytics webhook never overwrites the richer values from the function tool.

---

## 10. API Reference

### POST `/api/create-call`

Creates a lead and triggers an outbound Bolna call.

Request body:

```json
{
  "name": "Ankit",
  "phone": "+918289094077",
  "company": "Multyfi"
}
```

Successful response:

```json
{ "ok": true, "leadId": "<uuid>" }
```

If `BOLNA_API_KEY` or `BOLNA_AGENT_ID` is missing, the lead is still saved and the API returns a friendly fallback message instead of failing.

### POST `/api/webhook/bolna`

Receives qualification results from the Bolna custom tool and Analytics webhook.

Accepted body (JSON or form-encoded):

```json
{
  "lead_id": "<uuid>",
  "phone": "+91...",
  "qualified": true,
  "summary": "Lead is interested and requested a demo.",
  "status": "completed"
}
```

The route:

- Resolves the lead first by `lead_id`, then falls back to the latest matching `phone`.
- Only updates fields that are present.
- Returns the updated lead row.

### GET `/api/leads`

Returns all leads sorted by creation time descending. Used by the dashboard.

---

## 11. Running Locally

```bash
npm run dev
```

Open http://localhost:3000.

If you want Bolna to call your local dev server, you must expose it via a tunnel (for example ngrok) and use that URL inside the Bolna tool config and Analytics webhook. For production, prefer the deployed Vercel URL.

---

## 12. Deployment

This project is deployed on Vercel. Steps:

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add all environment variables from `.env`.
4. Deploy.
5. In Bolna, set both the custom tool URL and the Analytics webhook URL to:

   ```
   https://<your-vercel-domain>/api/webhook/bolna
   ```

---

## 13. Testing the Flow

### 13.1 Manual webhook test

You can verify the backend without making a real call:

```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "https://YOUR-DEPLOYED-DOMAIN/api/webhook/bolna" `
  -ContentType "application/json" `
  -Body '{"lead_id":"PASTE_LEAD_ID","qualified":true,"summary":"Demo requested","status":"completed"}'
```

The matching dashboard row should immediately turn into `completed` and `Qualified`.

### 13.2 Full call test

1. Open the deployed app.
2. Submit a new lead with a real phone number (use a verified number on a Bolna trial account).
3. Answer the call and complete the conversation.
4. Watch the dashboard update from `pending` → `in_progress` → `completed` with the AI-generated summary and the qualification result.

---

## 14. Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Lead stuck on `in_progress`, summary says "Waiting for webhook result" | Bolna tool URL not pointing at the deployed app, or Bolna is not invoking the tool | Set both the custom tool URL and Analytics webhook URL to the deployed `/api/webhook/bolna`. |
| Webhook returns "Unexpected end of JSON input" | Bolna `value.param` mapping is empty or wrong | Use the `param` mapping shown in section 9.2; never leave it as `{}`. |
| `lead_id` in payload looks like a Bolna call SID | Prompt is using `{call_sid}` instead of the app `lead_id` | The post-call logic in the prompt must explicitly forbid `call_sid` and allow an empty `lead_id`. The webhook then matches by phone. |
| Row briefly shows correct values, then switches back to "Pending" / default summary | Analytics webhook is overwriting good values from the tool call | This is already handled by only updating fields that are present. Make sure you redeployed after the fix in `app/api/webhook/bolna/route.ts`. |
| `/dashboard` returns 405 in `Invoke-RestMethod` | You posted to a page route instead of the API route | Always test against `/api/webhook/bolna`, not `/dashboard`. |

---

## 15. Outcome Metrics

The dashboard surfaces:

- Total leads.
- Qualified leads.
- In-progress leads.
- Qualification rate.

These map to common funnel KPIs for an inside sales team and can be exported into a deeper BI tool later.

---

## License

This project was built as part of an assignment and is intended for educational and demonstration purposes.
