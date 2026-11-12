import { HandleResolver as AtprotoHandleResolver } from "@atproto/identity";
import type { Handle } from "@repo/common/utils";

import type { IHandleResolver } from "../../application/interfaces/external/handle-resolver.js";
import type { Env } from "../../shared/env.js";

export class HandleResolver implements IHandleResolver {
  private readonly resolver = new AtprotoHandleResolver();

  constructor(private readonly env: Pick<Env, "ATPROTO_HANDLE_RESOLVER_URL">) {}

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
