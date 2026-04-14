"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

type HeroStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function HeroStagger({ children, className }: HeroStaggerProps) {
  const reduced = useReducedMotion();

  if (reduced !== false) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

type HeroStaggerChildProps = {
  children: ReactNode;
  className?: string;
};

export function HeroStaggerChild({ children, className }: HeroStaggerChildProps) {
  const reduced = useReducedMotion();

  if (reduced !== false) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={childVariants}>
      {children}
    </motion.div>
  );
}
