"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  company: string;
  callStatus: "pending" | "in_progress" | "completed" | "failed";
  qualified: boolean | null;
  summary: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("-");

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const response = await fetch("/api/leads");
        const data = (await response.json()) as {
          leads?: Lead[];
          error?: string;
        };

        if (!response.ok) {
          setError(data.error ?? "Failed to fetch leads.");
          return;
        }

        if (isMounted) {
          setLeads(data.leads ?? []);
          setLastUpdated(new Date().toLocaleTimeString());
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Network error while fetching leads.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeads();
    const interval = setInterval(loadLeads, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((lead) => lead.qualified === true).length;
  const inProgressLeads = leads.filter(
    (lead) => lead.callStatus === "in_progress",
  ).length;
  const qualificationRate =
    totalLeads === 0
      ? "0%"
      : `${Math.round((qualifiedLeads / totalLeads) * 100)}%`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Lead Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Auto-refreshing every 3 seconds. Last updated: {lastUpdated}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            Back to form
          </Link>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Leads" value={String(totalLeads)} />
          <MetricCard label="Qualified Leads" value={String(qualifiedLeads)} />
          <MetricCard label="In Progress" value={String(inProgressLeads)} />
          <MetricCard label="Qualification Rate" value={qualificationRate} />
        </section>

        {isLoading ? <p className="mb-3 text-zinc-300">Loading leads...</p> : null}
        {error ? <p className="mb-4 text-red-300">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-900/70">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-zinc-800/70 text-zinc-200">
              <tr>
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Qualified</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-zinc-400"
                  >
                    No leads yet. Submit one from the form page.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-zinc-100">{lead.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{lead.id}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-200">{lead.phone}</td>
                    <td className="px-3 py-3 text-zinc-200">{lead.company}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={lead.callStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <QualificationBadge qualified={lead.qualified} />
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-zinc-300">
                      {lead.summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-zinc-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: Lead["callStatus"] }) {
  const classes: Record<Lead["callStatus"], string> = {
    pending: "bg-zinc-600/30 text-zinc-200 border-zinc-500/40",
    in_progress: "bg-blue-600/20 text-blue-200 border-blue-500/40",
    completed: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
    failed: "bg-red-600/20 text-red-200 border-red-500/40",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function QualificationBadge({ qualified }: { qualified: boolean | null }) {
  if (qualified === true) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-200">
        Qualified
      </span>
    );
  }

  if (qualified === false) {
    return (
      <span className="inline-flex rounded-full border border-red-500/40 bg-red-600/20 px-2.5 py-1 text-xs font-medium text-red-200">
        Not Qualified
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-zinc-500/40 bg-zinc-600/20 px-2.5 py-1 text-xs font-medium text-zinc-200">
      Pending
    </span>
  );
}
