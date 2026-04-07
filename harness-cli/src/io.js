import readline from "node:readline/promises";

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
