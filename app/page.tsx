"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  AppShell,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/app/components/app-shell";

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/create-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, company }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        leadId?: string;
      };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to create call.");
        return;
      }

      setMessage(
        data.message ??
          `Lead submitted successfully. Lead ID: ${data.leadId ?? "N/A"}`,
      );
      setName("");
      setPhone("");
      setCompany("");
    } catch {
      setIsError(true);
      setMessage("Network error while creating call.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell active="home">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Outbound voice qualification
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Qualify inbound leads in minutes
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-400">
          Submit a lead, trigger an AI call instantly, and track qualification
          outcomes on the dashboard in real time.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Start qualification call
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Bolna will call this number and run your qualification script.
                </p>
              </div>
              <Link
                href="/dashboard"
                className={`${secondaryButtonClassName} shrink-0`}
              >
                View leads
              </Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Lead name
                </span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClassName}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Phone number
                </span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClassName}
                  placeholder="+91XXXXXXXXXX"
                  autoComplete="tel"
                  inputMode="tel"
                />
                <span className="mt-1.5 block text-xs text-slate-500">
                  Use E.164 format (e.g. +918289094077) for outbound testing.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  Company
                </span>
                <input
                  required
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className={inputClassName}
                  placeholder="Acme Pvt Ltd"
                  autoComplete="organization"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className={primaryButtonClassName}
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Submitting…
                  </>
                ) : (
                  "Start qualification call"
                )}
              </button>

              {message ? (
                <div
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                    isError
                      ? "border-red-500/40 bg-red-500/10 text-red-100"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {message}
                </div>
              ) : null}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-white">How it works</h2>
            <ol className="mt-5 space-y-4">
              <WorkflowStep
                number={1}
                title="Lead submitted"
                text="Sales enters name, phone, and company here."
              />
              <WorkflowStep
                number={2}
                title="Voice agent calls"
                text="Backend triggers a Bolna outbound call."
              />
              <WorkflowStep
                number={3}
                title="Qualification captured"
                text="Agent asks six questions and calls save_lead_result."
              />
              <WorkflowStep
                number={4}
                title="Dashboard updates"
                text="Status, summary, and qualified flag appear live."
              />
            </ol>
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
              <span className="font-medium text-amber-200">Tip:</span> On trial
              accounts, use verified phone numbers for reliable outbound tests.
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}: {
  number: number;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/90 text-sm font-semibold text-white shadow-md shadow-indigo-600/20">
        {number}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-medium text-slate-100">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </li>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
