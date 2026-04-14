"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

type HeroStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function HeroStagger({ children, className }: HeroStaggerProps) {
  const reduced = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.06,
        delayChildren: reduced ? 0 : 0.05,
      },
    },
  };

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

  const childVariants = {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.4, ease: EASE },
    },
  };

  return (
    <motion.div className={className} variants={childVariants}>
      {children}
    </motion.div>
  );
}
