export type RuntimeStorageMode = "file" | "neon";

export function getRuntimeStorageMode(): RuntimeStorageMode {
  return process.env.HARNESS_STORAGE_MODE === "neon" ? "neon" : "file";
}
