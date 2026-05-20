import Link from "next/link";

const navLinkBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: "home" | "dashboard";
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]"
        aria-hidden
      />

      <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition group-hover:bg-indigo-500">
              B
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-tight text-white">
                Bolna Lead Qualifier
              </span>
              <span className="block text-xs text-slate-400">
                Voice AI qualification
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`${navLinkBase} ${
                active === "home"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              New lead
            </Link>
            <Link
              href="/dashboard"
              className={`${navLinkBase} ${
                active === "dashboard"
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

export const inputClassName =
  "w-full rounded-xl border border-slate-700/90 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 disabled:opacity-60";

export const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";
