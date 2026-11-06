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

export const setInfiniteQueryData = (queryKey: unknown[], page: unknown) =>
  queryClient.setQueryData(queryKey, {
    pages: [page],
    pageParams: [undefined],
  });
