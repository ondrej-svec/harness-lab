"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const reduced = useReducedMotion();

  if (reduced !== false) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
