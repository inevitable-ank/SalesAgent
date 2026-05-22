import { addLead, updateLead } from "@/app/lib/lead-store";
import { normalizePhoneE164, PHONE_FORMAT_HINT } from "@/app/lib/phone";
import { isUseCaseId, resolveBolnaAgentId } from "@/app/lib/use-cases";

type CreateCallBody = {
  name?: string;
  phone?: string;
  company?: string;
  useCase?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCallBody;
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const company = body.company?.trim();
    const useCaseRaw = body.useCase?.trim() ?? "sales";

    if (!isUseCaseId(useCaseRaw)) {
      return Response.json(
        { error: "useCase must be 'sales' or 'apollo'" },
        { status: 400 },
      );
    }

    if (!name || !phone || !company) {
      return Response.json(
        { error: "name, phone and company are required" },
        { status: 400 },
      );
    }

    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) {
      return Response.json(
        { error: `Invalid phone number. ${PHONE_FORMAT_HINT}` },
        { status: 400 },
      );
    }

    const leadId = crypto.randomUUID();

    await addLead({
      id: leadId,
      useCase: useCaseRaw,
      name,
      phone: phoneE164,
      company,
      callStatus: "pending",
      qualified: null,
      summary: "Waiting for call to complete.",
      createdAt: new Date().toISOString(),
    });

    const apiKey = process.env.BOLNA_API_KEY;
    const agentId = resolveBolnaAgentId(useCaseRaw);

    if (!apiKey || !agentId) {
      return Response.json({
        ok: true,
        leadId,
        useCase: useCaseRaw,
        message:
          "Record stored. Set BOLNA_API_KEY and BOLNA_AGENT_ID (or BOLNA_AGENT_ID_SALES / BOLNA_AGENT_ID_APOLLO) to trigger real outbound calls.",
      });
    }

    const bolnaRes = await fetch("https://api.bolna.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        recipient_phone_number: phoneE164,
        user_data: {
          name,
          phone: phoneE164,
          company,
          lead_id: leadId,
          use_case: useCaseRaw,
        },
      }),
    });

    if (!bolnaRes.ok) {
      const errorText = await bolnaRes.text();
      let errorMessage = "Failed to trigger Bolna call.";
      try {
        const parsed = JSON.parse(errorText) as { message?: string };
        if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch {
        // keep default message
      }
      return Response.json(
        {
          error: errorMessage,
          bolnaResponse: errorText,
        },
        { status: 502 },
      );
    }

    await updateLead(leadId, {
      callStatus: "in_progress",
      summary: "Call triggered. Waiting for webhook result.",
    });

    return Response.json({ ok: true, leadId, useCase: useCaseRaw });
  } catch (error) {
    return Response.json(
      {
        error: "Unexpected error while creating call.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
