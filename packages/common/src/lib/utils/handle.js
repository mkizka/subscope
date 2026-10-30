export function assertHandle(input) {
  if (typeof input !== "string") {
    throw new Error(`Expected handle to be a string, but got ${String(input)}`);
  }
  if (!input.includes(".")) {
    throw new Error(`Expected handle to contain a ".", but got ${input}`);
  }
}
export function isHandle(handle) {
  try {
    assertHandle(handle);
    return true;
  } catch {
    return false;
  }
}
export function asHandle(handle) {
  assertHandle(handle);
  return handle;
}
