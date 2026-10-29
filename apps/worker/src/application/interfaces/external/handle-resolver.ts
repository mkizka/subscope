import type { Handle } from "@repo/common/utils";

export interface IHandleResolver {
  resolve: (handle: Handle) => Promise<string | undefined>;
}
