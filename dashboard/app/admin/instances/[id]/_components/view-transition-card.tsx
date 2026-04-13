"use client";

// Thin wrapper around React's <ViewTransition> component exported from
// the Next-bundled react-experimental (activated by
// experimental.viewTransition in next.config.ts). Not to be confused with
// Motion's layoutId — see docs/plans/2026-04-13-one-canvas-research-notes.md §1
// for why we use ViewTransition instead.
import type { ReactNode } from "react";
import { ViewTransition } from "react";

export function ViewTransitionCard({ name, children }: { name: string; children: ReactNode }) {
  return <ViewTransition name={name}>{children}</ViewTransition>;
}
