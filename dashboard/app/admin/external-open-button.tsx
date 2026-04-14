"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ExternalOpenButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> & {
  href: string;
  children: ReactNode;
};

const PENDING_CLEAR_MS = 600;

export function ExternalOpenButton({
  href,
  children,
  className,
  onClick,
  ...props
}: ExternalOpenButtonProps) {
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) {
      return;
    }
    setPending(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setPending(false), PENDING_CLEAR_MS);
  }

  return (
    <a
      {...props}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-75" : ""}`.trim()}
      href={href}
      onClick={handleClick}
      rel="noreferrer"
      target="_blank"
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
    </a>
  );
}
