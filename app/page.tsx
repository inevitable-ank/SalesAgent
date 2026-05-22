"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  AppShell,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/app/components/app-shell";
import { normalizePhoneE164, PHONE_FORMAT_HINT } from "@/app/lib/phone";
import {
  getUseCaseConfig,
  USE_CASE_LIST,
  type UseCaseId,
} from "@/app/lib/use-cases";

export default function Home() {
  const [useCase, setUseCase] = useState<UseCaseId>("sales");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = getUseCaseConfig(useCase);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const phoneE164 = normalizePhoneE164(phone);
      if (!phoneE164) {
        setIsError(true);
        setMessage(`Invalid phone number. ${PHONE_FORMAT_HINT}`);
        return;
      }

      const response = await fetch("/api/create-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phoneE164,
          company: detail,
          useCase,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        leadId?: string;
        bolnaResponse?: string;
      };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to create call.");
        return;
      }

      setMessage(
        data.message ??
          `${config.shortLabel} record saved. ID: ${data.leadId ?? "N/A"}`,
      );
      setName("");
      setPhone("");
      setDetail("");
    } catch {
      setIsError(true);
      setMessage("Network error while creating call.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell active="home">
      <div className="mb-8 max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Dual voice workflows — one platform
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Voice AI operations hub
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-400">
          Run <strong className="font-medium text-slate-300">sales qualification</strong>{" "}
          or <strong className="font-medium text-slate-300">Apollo post-discharge</strong>{" "}
          calls from the same app. All results appear on one dashboard.
        </p>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        {USE_CASE_LIST.map((id) => {
          const item = getUseCaseConfig(id);
          const selected = useCase === id;
          const ring =
            id === "apollo"
              ? "ring-teal-500/60 border-teal-500/40"
              : "ring-indigo-500/60 border-indigo-500/40";

          return (
            <button
              key={id}
              type="button"
              onClick={() => setUseCase(id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected
                  ? `bg-slate-800/80 ring-2 ${ring}`
                  : "border-white/10 bg-slate-900/40 hover:border-white/20"
              }`}
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {item.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {config.tagline}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Bolna will call this number using your{" "}
                  <span className="text-slate-300">{config.shortLabel}</span>{" "}
                  agent script.
                </p>
              </div>
              <Link
                href={`/dashboard?tab=${useCase}`}
                className={`${secondaryButtonClassName} shrink-0`}
              >
                View results
              </Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <input type="hidden" name="useCase" value={useCase} />

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  {config.nameLabel}
                </span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClassName}
                  placeholder={config.namePlaceholder}
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
                  {PHONE_FORMAT_HINT}
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  {config.detailLabel}
                </span>
                <input
                  required
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  className={inputClassName}
                  placeholder={config.detailPlaceholder}
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
                  config.submitLabel
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
            <h2 className="text-lg font-semibold text-white">
              {config.shortLabel} workflow
            </h2>
            <ol className="mt-5 space-y-4">
              {config.workflow.map((step, index) => (
                <WorkflowStep
                  key={step.title}
                  number={index + 1}
                  title={step.title}
                  text={step.text}
                  accent={config.accent}
                />
              ))}
            </ol>
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
              <span className="font-medium text-amber-200">Bolna tip:</span> Set{" "}
              <code className="text-amber-100/80">BOLNA_AGENT_ID_SALES</code> and{" "}
              <code className="text-amber-100/80">BOLNA_AGENT_ID_APOLLO</code>{" "}
              for separate prompts, or one <code className="text-amber-100/80">BOLNA_AGENT_ID</code> for both.
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
  accent,
}: {
  number: number;
  title: string;
  text: string;
  accent: "indigo" | "teal";
}) {
  const bg = accent === "teal" ? "bg-teal-600/90 shadow-teal-600/20" : "bg-indigo-600/90 shadow-indigo-600/20";

  return (
    <li className="flex gap-4">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-md ${bg}`}
      >
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
