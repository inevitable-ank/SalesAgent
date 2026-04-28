export type LeadRecord = {
  id: string;
  name: string;
  phone: string;
  company: string;
  callStatus: "pending" | "in_progress" | "completed" | "failed";
  qualified: boolean | null;
  summary: string;
  createdAt: string;
};

import { supabase } from "@/app/lib/supabase-server";

type LeadRow = {
  id: string;
  name: string;
  phone: string;
  company: string;
  call_status: LeadRecord["callStatus"];
  qualified: boolean | null;
  summary: string;
  created_at: string;
};

function mapToRecord(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    company: row.company,
    callStatus: row.call_status,
    qualified: row.qualified,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export async function addLead(lead: LeadRecord) {
  const { error } = await supabase.from("leads").insert({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    company: lead.company,
    call_status: lead.callStatus,
    qualified: lead.qualified,
    summary: lead.summary,
    created_at: lead.createdAt,
  });

  if (error) {
    throw new Error(`Failed to insert lead: ${error.message}`);
  }
}

export async function updateLead(
  id: string,
  updates: Partial<Pick<LeadRecord, "callStatus" | "qualified" | "summary">>,
) {
  const patch: Partial<LeadRow> = {};
  if (updates.callStatus !== undefined) {
    patch.call_status = updates.callStatus;
  }
  if (updates.qualified !== undefined) {
    patch.qualified = updates.qualified;
  }
  if (updates.summary !== undefined) {
    patch.summary = updates.summary;
  }

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle<LeadRow>();

  if (error) {
    throw new Error(`Failed to update lead by id: ${error.message}`);
  }
  return data ? mapToRecord(data) : null;
}

export async function updateLatestLeadByPhone(
  phone: string,
  updates: Partial<Pick<LeadRecord, "callStatus" | "qualified" | "summary">>,
) {
  const { data: latest, error: latestError } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (latestError) {
    throw new Error(`Failed to find latest lead by phone: ${latestError.message}`);
  }
  if (!latest) {
    return null;
  }

  return updateLead(latest.id, updates);
}

export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return (data ?? []).map((row) => mapToRecord(row as LeadRow));
}
