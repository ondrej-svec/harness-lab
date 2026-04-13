export function ControlRoomPersistentSummary({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}
