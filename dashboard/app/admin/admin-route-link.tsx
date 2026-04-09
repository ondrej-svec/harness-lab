"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useTransition } from "react";

type AdminRouteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
  replace?: boolean;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function AdminRouteLink({
  href,
  children,
  className,
  onClick,
  replace = false,
  target,
  download,
  ...props
}: AdminRouteLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || target === "_blank" || download || isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      if (replace) {
        router.replace(href);
        return;
      }

      router.push(href);
    });
  }

  return (
    <Link
      {...props}
      aria-busy={pending}
      className={`${className ?? ""} ${pending ? "cursor-wait opacity-75" : ""}`.trim()}
      href={href}
      onClick={handleClick}
      target={target}
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
    </Link>
  );
}
