import type { FetchHandlerObject } from "@atproto/xrpc";

import { AtpBaseClient } from "./generated/api/index.js";

export * from "./generated/api/index.js";
export { RecordNotFoundError } from "./generated/api/types/com/atproto/repo/getRecord.js";

export class SubscoAgent extends AtpBaseClient {
  constructor({
    sessionManager,
    atprotoProxy,
  }: {
    sessionManager: FetchHandlerObject;
    atprotoProxy: string;
  }) {
    super(async (url, init) => {
      const headers = new Headers(init.headers);
      headers.set("atproto-proxy", atprotoProxy);
      return await sessionManager.fetchHandler(url, { ...init, headers });
    });
  }
}
