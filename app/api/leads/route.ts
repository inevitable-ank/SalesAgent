import { getLeads } from "@/app/lib/lead-store";

export async function GET() {
  try {
    const leads = await getLeads();
    return Response.json({ leads });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch leads.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
