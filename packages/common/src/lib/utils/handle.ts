export type Handle = `${string}.${string}`;

export function assertHandle(input: unknown): asserts input is Handle {
  if (typeof input !== "string") {
    throw new Error(`Expected handle to be a string, but got ${String(input)}`);
  }
  if (!input.includes(".")) {
    throw new Error(`Expected handle to contain a ".", but got ${input}`);
  }
}

export function isHandle(handle: unknown): handle is Handle {
  try {
    assertHandle(handle);
    return true;
  } catch {
    return false;
  }
}

export function asHandle(handle: unknown): Handle {
  assertHandle(handle);
  return handle;
}
