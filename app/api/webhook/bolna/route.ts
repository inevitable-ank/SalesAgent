import { updateLead, updateLatestLeadByPhone } from "@/app/lib/lead-store";

type LeadStatus = "in_progress" | "completed" | "failed";
type WebhookPayload = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    const body = await parseWebhookPayload(request);
    const leadId = pickString(
      body.lead_id,
      getNested(body, "user_data", "lead_id"),
      getNested(body, "data", "lead_id"),
      getNested(body, "payload", "lead_id"),
    );
    const phone = pickString(
      body.phone,
      body.recipient_phone_number,
      body.user_number,
      body.from_number,
      body.to_number,
      getNested(body, "user_data", "phone"),
      getNested(body, "data", "phone"),
    );
    const rawStatus = pickString(
      body.status,
      body.call_status,
      getNested(body, "data", "status"),
      body.event,
    );
    const summary = pickString(
      body.summary,
      body.call_summary,
      getNested(body, "result", "summary"),
      getNested(body, "data", "summary"),
    );
    const qualified = pickBoolean(
      body.qualified,
      getNested(body, "result", "qualified"),
      getNested(body, "data", "qualified"),
    );

    if (!leadId && !phone) {
      return Response.json(
        { error: "lead_id or phone is required in webhook payload" },
        { status: 400 },
      );
    }

    const updates: Parameters<typeof updateLead>[1] = {};
    if (rawStatus) {
      updates.callStatus = normalizeStatus(rawStatus);
    }
    if (qualified !== null) {
      updates.qualified = qualified;
    }
    if (summary) {
      updates.summary = summary;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({
        ok: true,
        skipped: true,
        message: "No actionable fields in payload; skipped update.",
      });
    }

    if (leadId) {
      const updated = await updateLead(leadId, updates);

      if (updated) {
        return Response.json({ ok: true, lead: updated });
      }
    }

    if (!phone) {
      return Response.json(
        { error: "Lead not found for provided lead_id" },
        { status: 404 },
      );
    }

    const fallbackUpdated = await updateLatestLeadByPhone(phone, updates);

    if (!fallbackUpdated) {
      return Response.json(
        { error: "Lead not found for provided lead_id or phone" },
        { status: 404 },
      );
    }

    return Response.json({ ok: true, lead: fallbackUpdated });
  } catch (error) {
    return Response.json(
      {
        error: "Unexpected webhook error.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getNested(
  payload: WebhookPayload,
  key1: string,
  key2: string,
): unknown {
  const first = payload[key1];
  if (!first || typeof first !== "object" || Array.isArray(first)) {
    return undefined;
  }

  return (first as Record<string, unknown>)[key2];
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function pickBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") {
        return true;
      }
      if (value.toLowerCase() === "false") {
        return false;
      }
    }
  }
  return null;
}

function normalizeStatus(rawStatus: string | undefined): LeadStatus {
  if (!rawStatus) {
    return "completed";
  }

  const value = rawStatus.toLowerCase();
  if (value.includes("progress") || value.includes("queued")) {
    return "in_progress";
  }
  if (
    value.includes("fail") ||
    value.includes("error") ||
    value.includes("busy") ||
    value.includes("no-answer") ||
    value.includes("drop")
  ) {
    return "failed";
  }
  return "completed";
}

async function parseWebhookPayload(request: Request): Promise<WebhookPayload> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as WebhookPayload;
  } catch {
    // Some tool integrations send form-encoded bodies instead of JSON.
    const formValues = Object.fromEntries(new URLSearchParams(rawBody).entries());
    if (Object.keys(formValues).length > 0) {
      return formValues;
    }

    throw new Error("Invalid webhook payload format.");
  }
}
