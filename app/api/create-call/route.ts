import { addLead, updateLead } from "@/app/lib/lead-store";

type CreateCallBody = {
  name?: string;
  phone?: string;
  company?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCallBody;
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const company = body.company?.trim();

    if (!name || !phone || !company) {
      return Response.json(
        { error: "name, phone and company are required" },
        { status: 400 },
      );
    }

    const leadId = crypto.randomUUID();

    await addLead({
      id: leadId,
      name,
      phone,
      company,
      callStatus: "pending",
      qualified: null,
      summary: "Waiting for call to complete.",
      createdAt: new Date().toISOString(),
    });

    const apiKey = process.env.BOLNA_API_KEY;
    const agentId = process.env.BOLNA_AGENT_ID;

    if (!apiKey || !agentId) {
      // Assignment-friendly fallback so UI flow works without blocking on env setup.
      return Response.json({
        ok: true,
        leadId,
        message:
          "Lead stored. Set BOLNA_API_KEY and BOLNA_AGENT_ID to trigger real outbound calls.",
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
        recipient_phone_number: phone,
        user_data: {
          name,
          company,
          lead_id: leadId,
        },
      }),
    });

    if (!bolnaRes.ok) {
      const errorText = await bolnaRes.text();
      return Response.json(
        {
          error: "Failed to trigger Bolna call.",
          bolnaResponse: errorText,
        },
        { status: 502 },
      );
    }

    await updateLead(leadId, {
      callStatus: "in_progress",
      summary: "Call triggered. Waiting for webhook result.",
    });

    return Response.json({ ok: true, leadId });
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
