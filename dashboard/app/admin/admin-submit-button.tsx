"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

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
        {pending ? (
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : null}
        <span>{children}</span>
      </span>
    </button>
  );
}
