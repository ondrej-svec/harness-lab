"use client";

import { useDeferredValue, useState } from "react";
import {
  adminGhostButtonClassName,
  adminInputClassName,
  adminSecondaryButtonClassName,
} from "../../admin-ui";
import type { PresenterBlock } from "@/lib/workshop-data";

type SceneBlockEditorProps = {
  initialBlocks: PresenterBlock[];
  inputName: string;
  lang: "cs" | "en";
};

type EditorCopy = {
  addBlock: string;
  addLabel: string;
  editorTitle: string;
  emptyPreview: string;
  fields: {
    alt: string;
    attribution: string;
    body: string;
    caption: string;
    content: string;
    eyebrow: string;
    id: string;
    items: string;
    links: string;
    sourceHref: string;
    sourceLabel: string;
    title: string;
    tone: string;
    type: string;
  };
  hint: string;
  jsonTitle: string;
  moveDown: string;
  moveUp: string;
  previewTitle: string;
  remove: string;
  toneLabels: Record<"info" | "warning" | "success", string>;
};

const copy: Record<"cs" | "en", EditorCopy> = {
  cs: {
    addBlock: "Přidat blok",
    addLabel: "Typ nového bloku",
    editorTitle: "Editor bloků",
    emptyPreview: "Scéna zatím nemá žádné bloky.",
    fields: {
      alt: "Alt text",
      attribution: "Atribuce",
      body: "Body",
      caption: "Popisek",
      content: "Obsah",
      eyebrow: "Eyebrow",
      id: "ID bloku",
      items: "Položky",
      links: "Linky",
      sourceHref: "Zdroj URL",
      sourceLabel: "Zdrojový štítek",
      title: "Titulek",
      tone: "Tone",
      type: "Typ",
    },
    hint: "Normální cesta je přes formulářová pole. Pod tím stále vzniká stejné JSON pole pro API a skill.",
    jsonTitle: "JSON payload",
    moveDown: "Dolů",
    moveUp: "Nahoru",
    previewTitle: "Živý náhled bloků",
    remove: "Odebrat",
    toneLabels: {
      info: "info",
      warning: "warning",
      success: "success",
    },
  },
  en: {
    addBlock: "Add block",
    addLabel: "New block type",
    editorTitle: "Block editor",
    emptyPreview: "This scene has no blocks yet.",
    fields: {
      alt: "Alt text",
      attribution: "Attribution",
      body: "Body",
      caption: "Caption",
      content: "Content",
      eyebrow: "Eyebrow",
      id: "Block id",
      items: "Items",
      links: "Links",
      sourceHref: "Source URL",
      sourceLabel: "Source label",
      title: "Title",
      tone: "Tone",
      type: "Type",
    },
    hint: "The normal path is the structured form. It still submits the same JSON array underneath for the API and skill.",
    jsonTitle: "JSON payload",
    moveDown: "Down",
    moveUp: "Up",
    previewTitle: "Live block preview",
    remove: "Remove",
    toneLabels: {
      info: "info",
      warning: "warning",
      success: "success",
    },
  },
};

const blockTypes = [
  "hero",
  "rich-text",
  "bullet-list",
  "quote",
  "steps",
  "checklist",
  "image",
  "link-list",
  "callout",
  "participant-preview",
] as const satisfies PresenterBlock["type"][];

function createBlockId(type: PresenterBlock["type"]) {
  return `${type}-${Date.now().toString(36)}`;
}

function createBlock(type: PresenterBlock["type"], id = createBlockId(type)): PresenterBlock {
  switch (type) {
    case "hero":
      return { id, type, eyebrow: "", title: "", body: "" };
    case "rich-text":
      return { id, type, content: "" };
    case "bullet-list":
      return { id, type, title: "", items: [] };
    case "quote":
      return { id, type, quote: "", attribution: "" };
    case "steps":
      return { id, type, title: "", items: [] };
    case "checklist":
      return { id, type, title: "", items: [] };
    case "image":
      return { id, type, src: "", alt: "", caption: "", sourceLabel: "", sourceHref: "" };
    case "link-list":
      return { id, type, title: "", items: [] };
    case "callout":
      return { id, type, tone: "info", title: "", body: "" };
    case "participant-preview":
      return { id, type, body: "" };
  }
}

function newlineList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stepsToTextarea(block: Extract<PresenterBlock, { type: "steps" }>) {
  return block.items.map((item) => `${item.title}${item.body ? ` | ${item.body}` : ""}`).join("\n");
}

function parseSteps(value: string) {
  return newlineList(value).map((line) => {
    const [title, ...bodyParts] = line.split("|").map((part) => part.trim());
    return {
      title,
      body: bodyParts.join(" | ") || undefined,
    };
  });
}

function linksToTextarea(block: Extract<PresenterBlock, { type: "link-list" }>) {
  return block.items
    .map((item) => [item.label, item.href ?? "", item.description ?? ""].join(" | "))
    .join("\n");
}

function parseLinks(value: string) {
  return newlineList(value).map((line) => {
    const [label, href, ...descriptionParts] = line.split("|").map((part) => part.trim());
    return {
      label,
      href: href || undefined,
      description: descriptionParts.join(" | ") || undefined,
    };
  });
}

function SceneBlockPreview({ block }: { block: PresenterBlock }) {
  if (block.type === "hero") {
    return (
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{block.eyebrow || "hero"}</p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{block.title || "Untitled hero"}</p>
        {block.body ? <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{block.body}</p> : null}
      </div>
    );
  }

  if (block.type === "rich-text") {
    return <p className="whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">{block.content || " "}</p>;
  }

  if (block.type === "bullet-list") {
    return (
      <>
        {block.title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.title}</p> : null}
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
          {block.items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </>
    );
  }

  if (block.type === "quote") {
    return (
      <>
        <blockquote className="text-lg leading-8 text-[var(--text-primary)]">“{block.quote || "Quote"}”</blockquote>
        {block.attribution ? <p className="mt-3 text-sm text-[var(--text-muted)]">{block.attribution}</p> : null}
      </>
    );
  }

  if (block.type === "steps") {
    return (
      <>
        {block.title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.title}</p> : null}
        <div className="mt-3 space-y-3">
          {block.items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="grid gap-3 sm:grid-cols-[1.8rem_minmax(0,1fr)]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--text-primary)]">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                {item.body ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (block.type === "checklist") {
    return (
      <>
        {block.title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.title}</p> : null}
        <div className="mt-3 space-y-2">
          {block.items.map((item) => (
            <div key={item} className="flex gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2">
              <span className="mt-1 h-2.5 w-2.5 rounded-full border border-[var(--border-strong)]" />
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (block.type === "image") {
    return (
      <>
        <div className="rounded-[18px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-panel)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
          {block.src || "Image path"}
        </div>
        {block.caption ? <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{block.caption}</p> : null}
        {block.sourceLabel ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.sourceLabel}</p> : null}
      </>
    );
  }

  if (block.type === "link-list") {
    return (
      <>
        {block.title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.title}</p> : null}
        <div className="mt-3 space-y-2">
          {block.items.map((item) => (
            <div key={`${item.label}-${item.href ?? ""}`} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              {item.description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p> : null}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (block.type === "callout") {
    const toneClass =
      block.tone === "warning"
        ? "border-[var(--border-strong)] bg-[color:color-mix(in_oklab,var(--surface-soft)_78%,#d97706_22%)]"
        : block.tone === "success"
          ? "border-[var(--border-strong)] bg-[color:color-mix(in_oklab,var(--surface-soft)_82%,#15803d_18%)]"
          : "border-[var(--border)] bg-[color:color-mix(in_oklab,var(--surface-soft)_90%,#2563eb_10%)]";

    return (
      <div className={`rounded-[18px] border px-4 py-4 ${toneClass}`}>
        {block.title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{block.title}</p> : null}
        <p className={block.title ? "mt-2 text-sm leading-6 text-[var(--text-primary)]" : "text-sm leading-6 text-[var(--text-primary)]"}>
          {block.body || "Callout body"}
        </p>
      </div>
    );
  }

  return <p className="text-sm leading-6 text-[var(--text-secondary)]">{block.body || "Preview"}</p>;
}

export function SceneBlockEditor({ initialBlocks, inputName, lang }: SceneBlockEditorProps) {
  const ui = copy[lang];
  const [blocks, setBlocks] = useState<PresenterBlock[]>(initialBlocks);
  const [nextType, setNextType] = useState<PresenterBlock["type"]>("hero");
  const previewBlocks = useDeferredValue(blocks);
  const jsonValue = JSON.stringify(blocks, null, 2);

  function updateBlock(index: number, nextBlock: PresenterBlock) {
    setBlocks((current) => current.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    setBlocks((current) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [block] = next.splice(index, 1);
      next.splice(targetIndex, 0, block);
      return next;
    });
  }

  return (
    <div id="scene-block-editor" className="mt-3 space-y-4">
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.editorTitle}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{ui.hint}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[12rem]">
              <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.addLabel}</span>
              <select
                className={`${adminInputClassName} mt-2`}
                value={nextType}
                onChange={(event) => setNextType(event.target.value as PresenterBlock["type"])}
              >
                {blockTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={adminSecondaryButtonClassName}
              onClick={() => setBlocks((current) => [...current, createBlock(nextType)])}
            >
              {ui.addBlock}
            </button>
          </div>
        </div>
      </div>

      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.id}</span>
                <input
                  className={`${adminInputClassName} mt-2`}
                  value={block.id}
                  onChange={(event) => updateBlock(index, { ...block, id: event.target.value })}
                />
              </label>
              <label>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.type}</span>
                <select
                  className={`${adminInputClassName} mt-2`}
                  value={block.type}
                  onChange={(event) =>
                    updateBlock(index, createBlock(event.target.value as PresenterBlock["type"], block.id))
                  }
                >
                  {blockTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={adminGhostButtonClassName} onClick={() => moveBlock(index, "up")}>
                {ui.moveUp}
              </button>
              <button type="button" className={adminGhostButtonClassName} onClick={() => moveBlock(index, "down")}>
                {ui.moveDown}
              </button>
              <button
                type="button"
                className={adminGhostButtonClassName}
                onClick={() => setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index))}
              >
                {ui.remove}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {block.type === "hero" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.eyebrow}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.eyebrow ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, eyebrow: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.title}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.title}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.body}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2`}
                    rows={4}
                    value={block.body ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, body: event.target.value })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "rich-text" ? (
              <label>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.content}</span>
                <textarea
                  className={`${adminInputClassName} mt-2`}
                  rows={6}
                  value={block.content}
                  onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                />
              </label>
            ) : null}

            {block.type === "bullet-list" || block.type === "checklist" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.title}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.title ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.items}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2 font-mono text-xs leading-6`}
                    rows={6}
                    value={block.items.join("\n")}
                    onChange={(event) => updateBlock(index, { ...block, items: newlineList(event.target.value) })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "quote" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.body}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2`}
                    rows={4}
                    value={block.quote}
                    onChange={(event) => updateBlock(index, { ...block, quote: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.attribution}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.attribution ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, attribution: event.target.value })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "steps" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.title}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.title ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.items}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2 font-mono text-xs leading-6`}
                    rows={6}
                    value={stepsToTextarea(block)}
                    onChange={(event) => updateBlock(index, { ...block, items: parseSteps(event.target.value) })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "image" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">src</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.src}
                    onChange={(event) => updateBlock(index, { ...block, src: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.alt}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.alt}
                    onChange={(event) => updateBlock(index, { ...block, alt: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.caption}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2`}
                    rows={3}
                    value={block.caption ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.sourceLabel}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.sourceLabel ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, sourceLabel: event.target.value })}
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.sourceHref}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.sourceHref ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, sourceHref: event.target.value })}
                  />
                </label>
              </div>
            ) : null}

            {block.type === "link-list" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.title}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.title ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.links}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2 font-mono text-xs leading-6`}
                    rows={6}
                    value={linksToTextarea(block)}
                    onChange={(event) => updateBlock(index, { ...block, items: parseLinks(event.target.value) })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "callout" ? (
              <>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.tone}</span>
                  <select
                    className={`${adminInputClassName} mt-2`}
                    value={block.tone}
                    onChange={(event) =>
                      updateBlock(index, {
                        ...block,
                        tone: event.target.value as "info" | "warning" | "success",
                      })
                    }
                  >
                    <option value="info">{ui.toneLabels.info}</option>
                    <option value="warning">{ui.toneLabels.warning}</option>
                    <option value="success">{ui.toneLabels.success}</option>
                  </select>
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.title}</span>
                  <input
                    className={`${adminInputClassName} mt-2`}
                    value={block.title ?? ""}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                  />
                </label>
                <label>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.body}</span>
                  <textarea
                    className={`${adminInputClassName} mt-2`}
                    rows={4}
                    value={block.body}
                    onChange={(event) => updateBlock(index, { ...block, body: event.target.value })}
                  />
                </label>
              </>
            ) : null}

            {block.type === "participant-preview" ? (
              <label>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.fields.body}</span>
                <textarea
                  className={`${adminInputClassName} mt-2`}
                  rows={4}
                  value={block.body ?? ""}
                  onChange={(event) => updateBlock(index, { ...block, body: event.target.value })}
                />
              </label>
            ) : null}
          </div>
        </div>
      ))}

      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.previewTitle}</p>
        {previewBlocks.length > 0 ? (
          <div className="mt-4 space-y-4">
            {previewBlocks.map((block) => (
              <div key={block.id} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <SceneBlockPreview block={block} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{ui.emptyPreview}</p>
        )}
      </div>

      <details className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{ui.jsonTitle}</summary>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--text-secondary)]">{jsonValue}</pre>
      </details>

      <textarea className="hidden" name={inputName} readOnly value={jsonValue} />
    </div>
  );
}
