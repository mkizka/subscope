import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { z } from "zod";

import type { AppRouter } from "../../features/bff/trpc/app-router.js";

const RETRY_COUNTS = 2;

const trpcClientSchema = z.object({
  data: z.object({
    httpStatus: z.number(),
  }),
});

const getHTTPStatusCodeFromError = (error: unknown): number | null => {
  const parsed = trpcClientSchema.safeParse(error);
  if (parsed.success) {
    return parsed.data.data.httpStatus;
  }
  return null;
};

const handleUnauthorizedError = (error: Error) => {
  if (error instanceof TRPCClientError) {
    const statusCode = getHTTPStatusCodeFromError(error);
    if (statusCode === 401) {
      window.location.href = "/login";
    }
  }
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleUnauthorizedError,
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= RETRY_COUNTS) {
          return false;
        }
        if (error instanceof TRPCClientError) {
          const statusCode = getHTTPStatusCodeFromError(error);
          if (statusCode && statusCode >= 400 && statusCode < 500) {
            return false;
          }
        }
        return true;
      },
    },
  },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
