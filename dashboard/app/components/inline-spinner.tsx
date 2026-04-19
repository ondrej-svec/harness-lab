/**
 * Shared pending-state spinner. Renders a single aria-hidden span when
 * `active`, otherwise null. Kept as the single source of truth for the
 * dashboard's spinner markup — `SubmitButton` uses it internally for
 * `useFormStatus`-driven forms, and client components driven by
 * `useTransition` or local loading state render it directly with an
 * external `active` prop.
 */
export function InlineSpinner({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className ?? ""}`}
    />
  );
}
