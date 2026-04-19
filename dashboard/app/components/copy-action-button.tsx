"use client";

import { useState } from "react";

type Props = {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
};

export function CopyActionButton({ value, label, copiedLabel, className }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          setCopied(false);
        }
      }}
      type="button"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
