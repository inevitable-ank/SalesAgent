"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, secondaryButtonClassName } from "@/app/components/app-shell";
import { UseCaseBadge } from "@/app/components/use-case-badge";
import {
  getUseCaseConfig,
  USE_CASE_LIST,
  type UseCaseId,
} from "@/app/lib/use-cases";

type Lead = {
  id: string;
  useCase: UseCaseId;
  name: string;
  phone: string;
  company: string;
  callStatus: "pending" | "in_progress" | "completed" | "failed";
  qualified: boolean | null;
  summary: string;
  createdAt: string;
};

type DashboardTab = "all" | UseCaseId;

function readTabFromUrl(): DashboardTab {
  if (typeof window === "undefined") {
    return "all";
  }
  const fromUrl = new URLSearchParams(window.location.search).get("tab");
  if (fromUrl === "all" || fromUrl === "sales" || fromUrl === "apollo") {
    return fromUrl;
  }
  return "all";
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tab, setTab] = useState<DashboardTab>(readTabFromUrl);
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

  const filteredLeads = useMemo(
    () =>
      tab === "all" ? leads : leads.filter((lead) => lead.useCase === tab),
    [leads, tab],
  );

  const tabConfig =
    tab === "all" ? null : getUseCaseConfig(tab);

  const positiveOutcomes = filteredLeads.filter(
    (lead) => lead.qualified === true,
  ).length;
  const inProgressLeads = filteredLeads.filter(
    (lead) => lead.callStatus === "in_progress",
  ).length;
  const completedLeads = filteredLeads.filter(
    (lead) => lead.callStatus === "completed",
  ).length;
  const outcomeRate =
    filteredLeads.length === 0
      ? "0%"
      : `${Math.round((positiveOutcomes / filteredLeads.length) * 100)}%`;

  const detailColumnLabel =
    tab === "apollo"
      ? "Procedure / ward"
      : tab === "sales"
        ? "Company"
        : "Details";

  const outcomeColumnLabel =
    tab === "apollo"
      ? "Outcome"
      : tab === "sales"
        ? "Qualified"
        : "Outcome";

  const metricOutcomeLabel =
    tabConfig?.metricOutcomeLabel ?? "Positive outcomes";

  return (
    <AppShell active="dashboard">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Unified dashboard
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
          + New call
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterTab
          active={tab === "all"}
          onClick={() => setTab("all")}
          label="All"
          count={leads.length}
        />
        {USE_CASE_LIST.map((id) => {
          const config = getUseCaseConfig(id);
          const count = leads.filter((lead) => lead.useCase === id).length;
          return (
            <FilterTab
              key={id}
              active={tab === id}
              onClick={() => setTab(id)}
              label={config.shortLabel}
              count={count}
              variant={id}
            />
          );
        })}
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={tab === "all" ? "Total records" : `Total (${tabConfig?.shortLabel})`}
          value={String(filteredLeads.length)}
          accent="slate"
        />
        <MetricCard
          label={
            tab === "apollo"
              ? "Stable"
              : tab === "sales"
                ? "Qualified"
                : "Positive"
          }
          value={String(positiveOutcomes)}
          accent="emerald"
        />
        <MetricCard
          label="In progress"
          value={String(inProgressLeads)}
          accent="indigo"
        />
        <MetricCard
          label={metricOutcomeLabel}
          value={outcomeRate}
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
          {error.includes("use_case") ? (
            <p className="mt-2 text-xs text-red-200/80">
              Run <code className="text-red-100">supabase/add-use-case.sql</code> in
              your Supabase SQL editor, then retry.
            </p>
          ) : null}
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
        ) : filteredLeads.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5 sm:px-6">Type</th>
                  <th className="px-4 py-3.5">
                    {tab === "apollo" ? "Patient" : tab === "sales" ? "Lead" : "Contact"}
                  </th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">{detailColumnLabel}</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">{outcomeColumnLabel}</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 sm:pr-6">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="align-top transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <UseCaseBadge useCase={lead.useCase} />
                    </td>
                    <td className="px-4 py-4">
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
                      <OutcomeBadge
                        qualified={lead.qualified}
                        useCase={lead.useCase}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-400">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="max-w-xs px-4 py-4 pr-4 text-slate-300 sm:pr-6">
                      <SummaryCell summary={lead.summary} />
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

function FilterTab({
  active,
  onClick,
  label,
  count,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant?: UseCaseId;
}) {
  const activeRing =
    variant === "apollo"
      ? "ring-teal-500/50 bg-teal-600/10 text-teal-100"
      : variant === "sales"
        ? "ring-indigo-500/50 bg-indigo-600/10 text-indigo-100"
        : "ring-white/30 bg-white/10 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
        active
          ? `border-transparent ring-2 ${activeRing}`
          : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
      }`}
    >
      {label}
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
          active ? "bg-black/20" : "bg-slate-800 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryCell({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const text = summary?.trim() || "—";

  const measureTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el || text === "—" || expanded) {
      return;
    }
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  useEffect(() => {
    if (text === "—") {
      return;
    }

    measureTruncation();

    const el = textRef.current;
    if (!el) return;

    const observer = new ResizeObserver(measureTruncation);
    observer.observe(el);
    window.addEventListener("resize", measureTruncation);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureTruncation);
    };
  }, [text, expanded, measureTruncation]);

  useEffect(() => {
    if (!expanded) {
      const frame = requestAnimationFrame(measureTruncation);
      return () => cancelAnimationFrame(frame);
    }
  }, [expanded, measureTruncation]);

  if (text === "—") {
    return <span className="text-slate-500">—</span>;
  }

  return (
    <div className="min-w-[10rem] max-w-xs">
      <p
        ref={textRef}
        className={`text-sm leading-relaxed text-slate-300 ${
          expanded ? "whitespace-pre-wrap break-words" : "line-clamp-2"
        }`}
      >
        {text}
      </p>
      {text !== "—" && isTruncated && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-left text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          Read more
        </button>
      ) : null}
      {text !== "—" && expanded && isTruncated ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-left text-xs font-medium text-slate-400 transition hover:text-slate-300"
        >
          Show less
        </button>
      ) : null}
    </div>
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

function EmptyState({ tab }: { tab: DashboardTab }) {
  const label =
    tab === "all"
      ? "any workflow"
      : getUseCaseConfig(tab as UseCaseId).shortLabel;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 text-2xl text-slate-500">
        ∅
      </div>
      <p className="text-lg font-medium text-slate-200">No records yet</p>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        Start a {label} call from the home page. Results will appear here
        automatically.
      </p>
      <Link href="/" className={`${secondaryButtonClassName} mt-6`}>
        Go to home
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

function OutcomeBadge({
  qualified,
  useCase,
}: {
  qualified: boolean | null;
  useCase: UseCaseId;
}) {
  const config = getUseCaseConfig(useCase);

  if (qualified === true) {
    return (
      <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-200">
        {config.outcomePositive}
      </span>
    );
  }

  if (qualified === false) {
    return (
      <span className="inline-flex rounded-full border border-red-500/40 bg-red-600/20 px-2.5 py-1 text-xs font-medium text-red-200">
        {config.outcomeNegative}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-slate-500/40 bg-slate-600/20 px-2.5 py-1 text-xs font-medium text-slate-300">
      {config.outcomePending}
    </span>
  );
}
