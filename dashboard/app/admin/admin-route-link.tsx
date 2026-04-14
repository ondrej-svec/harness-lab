"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useTransition } from "react";

type AdminRouteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
  replace?: boolean;
  /**
   * When false, router.push is called with `{ scroll: false }` so the
   * viewport stays where it is. Use for in-section navigation (rail
   * tiles, tab switches, overlay toggles). Default true matches
   * Next.js's own <Link> default.
   */
  scroll?: boolean;
  /**
   * When true, children are rendered directly inside the anchor with
   * no inner centering span. The pending spinner becomes an
   * absolutely-positioned overlay at the top-right. Use for card- or
   * list-style links where the default flex-center wrapper collapses
   * layout (scene rail tiles, outline rail items). Default false keeps
   * the centered spinner+text pairing used by button-shaped links.
   */
  raw?: boolean;
};

export function isModifiedAnchorClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function AdminRouteLink({
  href,
  children,
  className,
  onClick,
  replace = false,
  scroll = true,
  raw = false,
  target,
  download,
  ...props
}: AdminRouteLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || target === "_blank" || download || isModifiedAnchorClick(event)) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      const options = scroll ? undefined : { scroll: false };
      if (replace) {
        router.replace(href, options);
        return;
      }
      router.push(href, options);
    });
  }

  const mergedClassName = `${className ?? ""} ${raw ? "relative" : ""} ${pending ? "cursor-wait opacity-75" : ""}`.trim();

  return (
    <Link
      {...props}
      aria-busy={pending}
      className={mergedClassName}
      href={href}
      onClick={handleClick}
      scroll={scroll}
      target={target}
    >
      {raw ? (
        <>
          {children}
          {pending ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-2 inline-flex h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
          ) : null}
        </>
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {pending ? (
            <span
              aria-hidden="true"
              className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
          ) : null}
          <span>{children}</span>
        </span>
      )}
    </Link>
  );
}
