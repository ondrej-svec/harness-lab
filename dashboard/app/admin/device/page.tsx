import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { getSession as proxyGetSession } from "@/lib/auth/neon-auth-proxy";
import { approveDeviceAuthorizationForCurrentSession, denyDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";

export async function approveAction(formData: FormData) {
  "use server";

  const userCode = String(formData.get("userCode") ?? "").trim().toUpperCase();
  if (!userCode) {
    return redirect("/admin/device?error=missing_code");
  }

  const result = await approveDeviceAuthorizationForCurrentSession(userCode);
  return redirect(result.ok ? `/admin/device?approved=${encodeURIComponent(userCode)}` : `/admin/device?error=${result.error}`);
}

export async function denyAction(formData: FormData) {
  "use server";

  const userCode = String(formData.get("userCode") ?? "").trim().toUpperCase();
  if (!userCode) {
    return redirect("/admin/device?error=missing_code");
  }

  const result = await denyDeviceAuthorization(userCode);
  return redirect(result.ok ? `/admin/device?denied=${encodeURIComponent(userCode)}` : `/admin/device?error=${result.error}`);
}

export default async function AdminDevicePage({
  searchParams,
}: {
  searchParams?: Promise<{ user_code?: string; approved?: string; denied?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = process.env.NEON_AUTH_BASE_URL
    ? (await proxyGetSession()).data
    : null;
  const userCode = String(params?.user_code ?? "").trim().toUpperCase();
  const isTerminalState = Boolean(params?.approved || params?.denied);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6 py-10">
      <div className="w-full max-w-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
        <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">facilitator device auth</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          Approve Harness CLI login
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Enter the code shown by `harness auth login` to grant the local CLI a short-lived facilitator session.
        </p>

        {!session?.user ? (
          <div className="mt-6 space-y-4">
            <p className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
              Sign in as a facilitator first, then return to this page to approve the CLI device code.
            </p>
            <Link
              className="inline-flex border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)]"
              href="/admin/sign-in"
            >
              facilitator sign-in
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {params?.approved ? (
              <p className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
                Device code approved: <strong>{params.approved}</strong>
              </p>
            ) : null}
            {params?.denied ? (
              <p className="border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                Device code denied: <strong>{params.denied}</strong>
              </p>
            ) : null}
            {params?.error ? (
              <p className="border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                {params.error}
              </p>
            ) : null}

            {isTerminalState ? (
              <div className="space-y-4">
                <p className="border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {params?.approved
                    ? "The terminal can continue automatically now. You can close this tab or start a new approval."
                    : "This device code is finished. You can close this tab or return to approve a different code."}
                </p>
                <Link
                  className="inline-flex w-full items-center justify-center border border-[var(--border-strong)] px-4 py-3 text-sm font-medium lowercase text-[var(--text-primary)]"
                  href="/admin/device"
                >
                  approve another code
                </Link>
              </div>
            ) : (
              <>
                <form action={approveAction} className="space-y-4">
                  <label className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]" htmlFor="user-code">
                    user code
                  </label>
                  <input
                    className="w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base uppercase text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
                    defaultValue={userCode}
                    id="user-code"
                    name="userCode"
                    placeholder="ABCD-EFGH"
                    required
                  />
                  <AdminSubmitButton className="w-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)]">
                    approve cli login
                  </AdminSubmitButton>
                </form>

                <form action={denyAction}>
                  <input name="userCode" type="hidden" value={userCode} />
                  <AdminSubmitButton
                    className="w-full border border-[var(--border-strong)] px-4 py-3 text-sm font-medium lowercase text-[var(--text-primary)]"
                    disabled={!userCode}
                  >
                    deny this code
                  </AdminSubmitButton>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
