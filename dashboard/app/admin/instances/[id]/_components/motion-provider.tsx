"use client";

import { LayoutGroup } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LayoutGroup>{children}</LayoutGroup>;
}
