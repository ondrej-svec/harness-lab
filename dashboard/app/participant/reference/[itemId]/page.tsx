import { redirect } from "next/navigation";
import Link from "next/link";
import { getParticipantSessionFromCookieStore } from "@/lib/event-access";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getReferenceBodyRepository } from "@/lib/reference-body-repository";
import { resolveEffectiveReferenceGroups } from "@/lib/workshop-data";
import { publicCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { resolveRepoLinkedHref } from "@/lib/repo-links";
import { MarkdownBody } from "@/app/components/markdown-body";
import { SiteHeader } from "@/app/components/site-header";
import referenceViewEn from "@/lib/generated/reference-en.json";
import referenceViewCs from "@/lib/generated/reference-cs.json";
import type {
  GeneratedReferenceItem,
  GeneratedReferenceView,
} from "@/lib/types/bilingual-reference";

export const dynamic = "force-dynamic";

function findItem(groups: GeneratedReferenceItem["id"][] extends never ? never : GeneratedReferenceItem[], itemId: string): GeneratedReferenceItem | null {
  // No-op wrapper; exists only to satisfy type inference that `groups` is an item list — actually we receive groups from resolveEffectiveReferenceGroups, so we search nested items. Inlined below for clarity.
  void groups;
  void itemId;
  return null;
}

function findHostedItem(
  groups: GeneratedReferenceView["groups"] | null,
  itemId: string,
): GeneratedReferenceItem | null {
  if (!groups) return null;
  for (const group of groups) {
    const item = group.items.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}

export default async function ParticipantReferenceBodyPage({
  params,
  searchParams,
}: {
  params: Promise<{ itemId: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  void findItem; // tree-shake placeholder used only for type narrowing exercise
  const { itemId } = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = publicCopy[lang];

  const session = await getParticipantSessionFromCookieStore();
  if (!session || !session.participantId) {
    redirect(withLang("/participant", lang));
  }

  const instance = await getWorkshopInstanceRepository().getInstance(session.instanceId);
  if (!instance) {
    redirect(withLang("/participant", lang));
  }

  const defaultView = (lang === "en" ? referenceViewEn : referenceViewCs) as GeneratedReferenceView;
  const effectiveGroups = resolveEffectiveReferenceGroups(instance) ?? defaultView.groups;

  const item = findHostedItem(effectiveGroups, itemId);
  if (!item || item.kind !== "hosted") {
    redirect(lang === "en" ? "/participant?lang=en#reference" : "/participant#reference");
  }

  // Body precedence: instance override → compiled default (only present on
  // compiled-default items; overrides from the CLI don't carry bodies).
  const override = await getReferenceBodyRepository().get(session.instanceId, itemId);
  let body = override?.body ?? null;
  if (!body) {
    const defaultItem = findHostedItem(defaultView.groups, itemId);
    body = defaultItem?.body ?? null;
  }
  if (!body) {
    redirect(lang === "en" ? "/participant?lang=en#reference" : "/participant#reference");
  }

  const sourceHref =
    "sourceUrl" in item && item.sourceUrl ? resolveRepoLinkedHref(item.sourceUrl) : null;

  // `withLang` doesn't handle hash fragments, so compose the back link
  // manually: query string before the hash. Czech omits ?lang= entirely.
  const backHref = lang === "en" ? "/participant?lang=en#reference" : "/participant#reference";

  const backLabel = lang === "en" ? "← Back to reference" : "← Zpět na podklady";
  const sourceLabel = lang === "en" ? "View source on GitHub" : "Zdroj na GitHubu";
  const overrideBadge = lang === "en" ? "custom for this workshop" : "upraveno pro tento workshop";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <SiteHeader
          isParticipant
          lang={lang}
          copy={copy}
          csHref={withLang(`/participant/reference/${itemId}`, "cs")}
          enHref={withLang(`/participant/reference/${itemId}`, "en")}
        />
        <article className="mt-8">
          <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href={backHref} className="text-[var(--text-accent)] hover:underline">
              {backLabel}
            </Link>
            <div className="flex items-center gap-3">
              {override ? (
                <span className="rounded-full border border-[var(--border-muted)] bg-[var(--surface-muted)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  {overrideBadge}
                </span>
              ) : null}
              {sourceHref ? (
                <a
                  href={sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-accent)] hover:underline"
                >
                  {sourceLabel} ↗
                </a>
              ) : null}
            </div>
          </nav>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {item.label}
            </h1>
            {item.description ? (
              <p className="mt-2 text-base text-[var(--text-secondary)]">{item.description}</p>
            ) : null}
          </header>
          <MarkdownBody source={body} />
        </article>
      </div>
    </main>
  );
}
