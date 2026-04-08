"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="cs">
      <body>
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] px-5 py-8 text-[var(--text-primary)] sm:px-8">
          <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center">
            <section className="w-full rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-7 shadow-[var(--shadow-soft)] sm:p-9">
              <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">harness lab / runtime</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl">
                Tuhle obrazovku se nepodařilo načíst.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                Aplikace narazila na neočekávanou chybu. Obnovte obrazovku nebo spusťte znovu poslední akci.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-3 text-sm font-medium lowercase text-[var(--surface)] transition hover:bg-transparent hover:text-[var(--text-primary)]"
                  onClick={() => reset()}
                  type="button"
                >
                  Zkusit znovu
                </button>
                <Link
                  className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium lowercase text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  href="/"
                >
                  Zpět na úvod
                </Link>
              </div>
              {error.digest ? (
                <p className="mt-6 text-xs lowercase tracking-[0.14em] text-[var(--text-muted)]">
                  trace {error.digest}
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
