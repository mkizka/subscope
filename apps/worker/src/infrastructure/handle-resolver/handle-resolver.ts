import { HandleResolver as AtprotoHandleResolver } from "@atproto/identity";
import type { Handle } from "@repo/common/utils";

import type { IHandleResolver } from "../../application/interfaces/external/handle-resolver.js";

export class HandleResolver implements IHandleResolver {
  private readonly resolver = new AtprotoHandleResolver();

  constructor(private readonly handleResolverUrl: string | undefined) {}

  async resolve(handle: Handle) {
    if (!this.handleResolverUrl) {
      return await this.resolver.resolve(handle);
    }
    const url = new URL(
      "/xrpc/com.atproto.identity.resolveHandle",
      this.handleResolverUrl,
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
