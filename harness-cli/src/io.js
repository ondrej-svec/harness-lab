import readline from "node:readline/promises";
import { Chalk } from "chalk";

export async function prompt(io, label) {
  const rl = readline.createInterface({
    input: io.stdin,
    output: io.stderr,
  });

  try {
    const value = await rl.question(label);
    return value.trim();
  } finally {
    rl.close();
  }
}

export function writeLine(stream, line = "") {
  stream.write(`${line}\n`);
}

function supportsColor(stream, env = {}) {
  if (!stream?.isTTY) {
    return false;
  }

  if ("NO_COLOR" in env) {
    return false;
  }

  return env.TERM !== "dumb";
}

function createStyler(stream, env) {
  return new Chalk({ level: supportsColor(stream, env) ? 1 : 0 });
}

function getWrapWidth(stream) {
  const width = Number(stream?.columns);
  if (!Number.isFinite(width) || width <= 0) {
    return 88;
  }

  return Math.max(60, Math.min(width, 100));
}

function wrapText(text, width, indent = "", subsequentIndent = indent) {
  if (!text) {
    return [indent.trimEnd()];
  }

  const firstLineWidth = Math.max(20, width - indent.length);
  const laterLineWidth = Math.max(20, width - subsequentIndent.length);
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentPrefix = indent;
  let currentText = "";

  for (const word of words) {
    const lineWidth = currentPrefix === indent ? firstLineWidth : laterLineWidth;
    const candidate = currentText ? `${currentText} ${word}` : word;

    if (candidate.length <= lineWidth || currentText.length === 0) {
      currentText = candidate;
      continue;
    }

    lines.push(`${currentPrefix}${currentText}`);
    currentPrefix = subsequentIndent;
    currentText = word;
  }

  lines.push(`${currentPrefix}${currentText}`);
  return lines;
}

function writeWrapped(stream, text, options = {}) {
  const width = options.width ?? getWrapWidth(stream);
  const indent = options.indent ?? "";
  const subsequentIndent = options.subsequentIndent ?? indent;

  for (const line of wrapText(text, width, indent, subsequentIndent)) {
    writeLine(stream, line);
  }
}

export function createCliUi(io) {
  function streamFor(target) {
    return target === "stderr" ? io.stderr : io.stdout;
  }

  function blank(target = "stdout") {
    writeLine(streamFor(target));
  }

  function heading(title, options = {}) {
    const target = options.stream ?? "stdout";
    const stream = streamFor(target);
    const chalk = createStyler(stream, io.env);
    writeLine(stream, chalk.cyan.bold(title));
    writeLine(stream, chalk.dim("=".repeat(title.length)));
  }

  function section(title, options = {}) {
    const target = options.stream ?? "stdout";
    const stream = streamFor(target);
    const chalk = createStyler(stream, io.env);
    writeLine(stream, chalk.bold(title));
  }

  function paragraph(text, options = {}) {
    writeWrapped(streamFor(options.stream ?? "stdout"), text, options);
  }

  function status(kind, text, options = {}) {
    const target = options.stream ?? (kind === "error" ? "stderr" : "stdout");
    const stream = streamFor(target);
    const chalk = createStyler(stream, io.env);
    const prefixMap = {
      ok: chalk.green.bold("[ok]"),
      info: chalk.cyan.bold("[info]"),
      warn: chalk.yellow.bold("[warn]"),
      error: chalk.red.bold("[error]"),
    };
    const prefix = prefixMap[kind] ?? "[info]";
    writeWrapped(stream, `${prefix} ${text}`, {
      indent: options.indent ?? "",
      subsequentIndent: options.subsequentIndent ?? "       ",
      width: options.width,
    });
  }

  function keyValue(label, value, options = {}) {
    const target = options.stream ?? "stdout";
    const stream = streamFor(target);
    const indent = options.indent ?? "  ";
    const subsequentIndent = options.subsequentIndent ?? "  ";
    const renderedValue = String(value);

    if (!/\s/.test(renderedValue)) {
      writeLine(stream, `${indent}${label}: ${renderedValue}`);
      return;
    }

    writeWrapped(stream, `${label}: ${value}`, {
      indent,
      subsequentIndent,
      width: options.width,
    });
  }

  function numberedList(items, options = {}) {
    const target = options.stream ?? "stdout";
    const stream = streamFor(target);

    items.forEach((item, index) => {
      const indent = `  ${index + 1}. `;
      writeWrapped(stream, item, {
        indent,
        subsequentIndent: "     ",
        width: options.width,
      });
    });
  }

  function commandList(items, options = {}) {
    const target = options.stream ?? "stdout";
    const stream = streamFor(target);

    for (const item of items) {
      writeWrapped(stream, item, {
        indent: "  ",
        subsequentIndent: "    ",
        width: options.width,
      });
    }
  }

  function json(title, value, options = {}) {
    const target = options.stream ?? "stdout";
    heading(title, { stream: target });
    writeLine(streamFor(target), JSON.stringify(value, null, 2));
  }

  return {
    blank,
    heading,
    section,
    paragraph,
    status,
    keyValue,
    numberedList,
    commandList,
    json,
  };
}
