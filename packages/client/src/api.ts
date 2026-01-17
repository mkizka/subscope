import type { OAuthSession } from "@atproto/oauth-client";

import { AtpBaseClient } from "./generated/api/index.js";

export * from "./generated/api/index.js";
export { RecordNotFoundError } from "./generated/api/types/com/atproto/repo/getRecord.js";

export class SubscoAgent extends AtpBaseClient {
  private oauthSession;

  constructor({
    oauthSession,
    atprotoProxy,
  }: {
    oauthSession: OAuthSession;
    atprotoProxy: string;
  }) {
    super(async (url, init) => {
      const headers = new Headers(init.headers);
      headers.set("atproto-proxy", atprotoProxy);
      return await oauthSession.fetchHandler(url, { ...init, headers });
    });
    this.oauthSession = oauthSession;
  }

  get did() {
    return this.oauthSession.did;
  }
}

export class SubscoBrowserAgent extends AtpBaseClient {
  constructor() {
    super({ service: location.href });
  }
}
