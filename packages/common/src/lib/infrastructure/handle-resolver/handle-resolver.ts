import { HandleResolver as AtprotoHandleResolver } from "@atproto/identity";

import type { IHandleResolver } from "../../interface/handle-resolver.js";
import type { Handle } from "../../utils/handle.js";

export class HandleResolver implements IHandleResolver {
  private readonly resolver = new AtprotoHandleResolver();

  constructor(private readonly env: { ATPROTO_HANDLE_RESOLVER_URL?: string }) {}

  async resolve(handle: Handle) {
    if (!this.env.ATPROTO_HANDLE_RESOLVER_URL) {
      return await this.resolver.resolve(handle);
    }
    const url = new URL(
      "/xrpc/com.atproto.identity.resolveHandle",
      this.env.ATPROTO_HANDLE_RESOLVER_URL,
    );
    url.searchParams.set("handle", handle);
    const res = await fetch(url);
    if (!res.ok) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { did } = (await res.json()) as { did: string };
    return did;
  }
}
