"use client";

// Thin wrapper around React's <ViewTransition> component exported from
// the Next-bundled react-experimental (activated by
// experimental.viewTransition in next.config.ts). Not to be confused with
// Motion's layoutId — see docs/plans/2026-04-13-one-canvas-research-notes.md §1
// for why we use ViewTransition instead.
//
// The import is present at compile time (React 19.2 ships the d.ts) but
// the runtime export only exists when Next.js aliases `react` to its
// vendored react-experimental copy. In Vitest / plain Node, ViewTransition
// is undefined, so we degrade to a passthrough — that's the correct
// fallback anyway (the browser will just swap content without a morph).
import * as ReactExports from "react";
import type { ComponentType, ReactNode } from "react";

type ViewTransitionProps = { name: string; children: ReactNode };

const ViewTransition = (ReactExports as unknown as {
  ViewTransition?: ComponentType<ViewTransitionProps>;
}).ViewTransition;

export function ViewTransitionCard({ name, children }: ViewTransitionProps) {
  if (!ViewTransition) {
    return <>{children}</>;
  }
  return <ViewTransition name={name}>{children}</ViewTransition>;
}
