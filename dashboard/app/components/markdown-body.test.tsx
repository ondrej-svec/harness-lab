import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "./markdown-body";

function renderMd(source: string) {
  return renderToStaticMarkup(<MarkdownBody source={source} />);
}

describe("MarkdownBody", () => {
  it("renders headings and paragraphs", () => {
    const html = renderMd("# Title\n\nHello world.");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<p>Hello world.</p>");
  });

  it("renders GFM tables", () => {
    const html = renderMd("| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("renders GFM task lists", () => {
    const html = renderMd("- [ ] pending\n- [x] done\n");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });

  it("renders fenced code blocks", () => {
    const html = renderMd("```ts\nconst x = 1;\n```");
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1");
  });

  it("renders safe http links", () => {
    const html = renderMd("[external](https://example.com)");
    expect(html).toContain('href="https://example.com"');
  });

  it("strips raw <script> tags", () => {
    const html = renderMd("before\n\n<script>alert(1)</script>\n\nafter");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)");
  });

  it("strips raw <iframe> tags", () => {
    const html = renderMd("<iframe src=\"https://evil.example.com\"></iframe>");
    expect(html).not.toContain("<iframe");
  });

  it("strips raw <style> tags", () => {
    const html = renderMd("<style>body { display: none; }</style>\n\nText");
    expect(html).not.toContain("<style>");
    expect(html).toContain("Text");
  });

  it("strips javascript: link hrefs", () => {
    const html = renderMd("[click me](javascript:alert(1))");
    expect(html).not.toMatch(/href="javascript:/);
    // Text should still render even if href is dropped.
    expect(html).toContain("click me");
  });

  it("strips data: URIs on images", () => {
    const html = renderMd("![x](data:text/html,<script>alert(1)</script>)");
    expect(html).not.toMatch(/src="data:/);
  });

  it("strips on* event-handler attributes", () => {
    const html = renderMd('<a href="https://example.com" onclick="alert(1)">link</a>');
    expect(html).not.toContain("onclick");
  });

  it("strips <object> and <embed>", () => {
    const html = renderMd(
      '<object data="https://evil.example.com"></object>\n\n<embed src="https://evil.example.com" />',
    );
    expect(html).not.toContain("<object");
    expect(html).not.toContain("<embed");
  });

  it("preserves strikethrough (GFM)", () => {
    const html = renderMd("~~struck~~");
    expect(html).toContain("<del>struck</del>");
  });

  it("preserves bold and italic", () => {
    const html = renderMd("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("preserves lists", () => {
    const html = renderMd("- a\n- b\n- c");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>a</li>");
  });

  it("preserves blockquotes", () => {
    const html = renderMd("> quoted");
    expect(html).toContain("<blockquote>");
  });
});
