import { asDatetimeString } from "@atproto/syntax";
import { QueryClient } from "@tanstack/react-query";

export type Data<T extends (...args: never) => unknown> =
  Awaited<ReturnType<T>> extends {
    data: infer D;
  }
    ? D
    : never;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

export const infinite = <T extends (...args: never) => unknown>(
  page: Data<T>,
) => ({
  pages: [page],
  pageParams: [undefined],
});

export const alice = {
  did: "did:plc:alice",
  handle: "alice.bsky.social",
  displayName: "Alice",
} as const;
export const bob = {
  did: "did:plc:bob",
  handle: "bob.bsky.social",
  displayName: "Bob",
} as const;
export const indexedAt = asDatetimeString(new Date().toISOString());
