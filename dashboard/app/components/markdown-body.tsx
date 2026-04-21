import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Sanitized Markdown renderer for facilitator-authored reference bodies.
 *
 * Runs as a Server Component. The sanitizer schema allows GitHub Flavored
 * Markdown (tables, strikethrough, task lists, autolinks) but strips:
 * - raw HTML tags (including `<script>`, `<iframe>`, `<style>`)
 * - non-safe link protocols (javascript:, data:, vbscript:)
 * - event-handler attributes
 *
 * Facilitators push arbitrary Markdown via CLI, so the sanitizer is the
 * primary XSS defence. Anything that would round-trip a `<script>` or a
 * `javascript:` href into rendered HTML must be caught here.
 */

// Extend rehype-sanitize's default (GitHub-safe) schema with the GFM
// constructs we want to preserve — task-list checkboxes, <del> from
// strikethrough, <sup>/<sub>. Keep the allowlist narrow.
const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "del",
    "sub",
    "sup",
  ],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    input: [["type", "checkbox"], "checked", "disabled"],
  },
  protocols: {
    ...(defaultSchema.protocols ?? {}),
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

export function MarkdownBody({ source }: { source: string }) {
  return (
    <div className="prose prose-invert max-w-none [&_a]:text-[var(--text-accent)] [&_a:hover]:underline [&_code]:rounded-md [&_code]:bg-[var(--surface-muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:rounded-lg [&_pre]:bg-[var(--surface-elevated)] [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:px-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
