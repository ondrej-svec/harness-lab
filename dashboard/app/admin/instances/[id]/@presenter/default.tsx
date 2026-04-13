// Parallel slot default. Rendered when the @presenter slot has no match —
// i.e. when we're not navigating through the intercepting route. Returns
// null so the admin page renders alone.
export default function PresenterSlotDefault() {
  return null;
}
