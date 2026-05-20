"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, secondaryButtonClassName } from "@/app/components/app-shell";

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
  const [lastUpdated, setLastUpdated] = useState<string>("—");

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
  const completedLeads = leads.filter(
    (lead) => lead.callStatus === "completed",
  ).length;
  const qualificationRate =
    totalLeads === 0
      ? "0%"
      : `${Math.round((qualifiedLeads / totalLeads) * 100)}%`;

  return (
    <AppShell active="dashboard">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Lead dashboard
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live — refreshes every 3s
            </span>
            <span className="text-slate-600">·</span>
            <span>Last updated {lastUpdated}</span>
          </p>
        </div>
        <Link href="/" className={secondaryButtonClassName}>
          + New lead
        </Link>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total leads"
          value={String(totalLeads)}
          accent="slate"
        />
        <MetricCard
          label="Qualified"
          value={String(qualifiedLeads)}
          accent="emerald"
        />
        <MetricCard
          label="In progress"
          value={String(inProgressLeads)}
          accent="indigo"
        />
        <MetricCard
          label="Qualification rate"
          value={qualificationRate}
          hint={`${completedLeads} completed`}
          accent="amber"
        />
      </section>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl shadow-black/20">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-white/5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse gap-4 px-4 py-5 sm:px-6"
              >
                <div className="h-10 w-32 rounded-lg bg-slate-800" />
                <div className="h-10 flex-1 rounded-lg bg-slate-800/80" />
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5 sm:px-6">Lead</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Qualified</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 sm:pr-6">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="align-top transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <p className="font-medium text-white">{lead.name}</p>
                      <p
                        className="mt-1 max-w-[10rem] truncate font-mono text-xs text-slate-500"
                        title={lead.id}
                      >
                        {lead.id}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-300 sm:text-sm">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-4 text-slate-200">{lead.company}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={lead.callStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <QualificationBadge qualified={lead.qualified} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-400">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="max-w-xs px-4 py-4 pr-4 text-slate-300 sm:pr-6">
                      <p className="line-clamp-3 leading-relaxed" title={lead.summary}>
                        {lead.summary || "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "slate" | "emerald" | "indigo" | "amber";
}) {
  const accentBar: Record<typeof accent, string> = {
    slate: "bg-slate-500",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-black/10">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${accentBar[accent]}`}
        aria-hidden
      />
      <p className="pl-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 pl-2 text-3xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 pl-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 text-2xl text-slate-500">
        ∅
      </div>
      <p className="text-lg font-medium text-slate-200">No leads yet</p>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Submit a lead from the form to trigger a qualification call. Results
        will show up here automatically.
      </p>
      <Link
        href="/"
        className={`${secondaryButtonClassName} mt-6`}
      >
        Create first lead
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: Lead["callStatus"] }) {
  const classes: Record<Lead["callStatus"], string> = {
    pending: "bg-slate-600/30 text-slate-200 border-slate-500/40",
    in_progress: "bg-indigo-600/20 text-indigo-200 border-indigo-500/40",
    completed: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
    failed: "bg-red-600/20 text-red-200 border-red-500/40",
  };

  const labels: Record<Lead["callStatus"], string> = {
    pending: "Pending",
    in_progress: "In progress",
    completed: "Completed",
    failed: "Failed",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${classes[status]}`}
    >
      {labels[status]}
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
        Not qualified
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-slate-500/40 bg-slate-600/20 px-2.5 py-1 text-xs font-medium text-slate-300">
      Pending
    </span>
  );
}
