"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { InlineSpinner } from "@/app/components/inline-spinner";

export function AdminSubmitButton({
  children,
  className,
  disabled,
  type = "submit",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      aria-busy={pending}
      className={`${className} ${pending ? "cursor-wait opacity-75" : ""}`}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <InlineSpinner active={pending} />
        <span>{children}</span>
      </span>
    </button>
  );
}
