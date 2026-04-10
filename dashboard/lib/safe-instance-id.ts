/**
 * Instance IDs are slug-style identifiers (e.g. "sample-studio-a").
 * This guard prevents path-traversal via crafted IDs like "../../etc".
 */
const SAFE_INSTANCE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,128}$/;

export function assertSafeInstanceId(instanceId: string): void {
  if (!SAFE_INSTANCE_ID.test(instanceId)) {
    throw new Error(`Unsafe instanceId rejected: ${instanceId}`);
  }
}
