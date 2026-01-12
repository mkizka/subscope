import { QueryClient } from "@tanstack/react-query";
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

export const queryClient = new QueryClient({
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
