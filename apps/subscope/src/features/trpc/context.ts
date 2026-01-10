import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Context = {};

export const createContext = (_: CreateExpressContextOptions): Context => {
  return {};
};
