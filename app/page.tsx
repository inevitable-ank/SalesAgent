"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Voice AI Lead Qualification
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Bolna Lead Qualifier
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Capture inbound leads, trigger an AI call instantly, and track
                qualification outcomes in real time from your dashboard.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Open Dashboard
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Start Qualification Call</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Enter lead details and trigger an outbound qualification call.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-300">
                  Lead name
                </span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none transition placeholder:text-zinc-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-zinc-300">
                  Phone number
                </span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none transition placeholder:text-zinc-500 focus:border-blue-500"
                  placeholder="+91XXXXXXXXXX"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-zinc-300">Company</span>
                <input
                  required
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none transition placeholder:text-zinc-500 focus:border-blue-500"
                  placeholder="Acme Pvt Ltd"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Start Qualification Call"}
              </button>

              {message ? (
                <p
                  className={`rounded-md border px-3 py-2 text-sm ${
                    isError
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">Workflow</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <Step
                number="1"
                title="Lead submitted"
                text="Sales user enters lead details in this form."
              />
              <Step
                number="2"
                title="Voice agent called"
                text="Backend triggers Bolna outbound call instantly."
              />
              <Step
                number="3"
                title="Qualification captured"
                text="Agent asks questions and sends result via webhook."
              />
              <Step
                number="4"
                title="Dashboard updated"
                text="Status, summary, and qualification score are shown."
              />
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-zinc-400">
              Tip: Use verified numbers on trial accounts for outbound testing.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-3">
      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {number}
      </span>
      <div>
        <p className="font-medium text-zinc-100">{title}</p>
        <p className="text-zinc-400">{text}</p>
      </div>
    </div>
  );
}
