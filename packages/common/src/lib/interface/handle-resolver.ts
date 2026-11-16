import type { Handle } from "../utils/handle.js";

export interface IHandleResolver {
  resolve: (handle: Handle) => Promise<string | undefined>;
}
