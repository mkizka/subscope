import { isDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import { isHandle } from "@repo/common/utils";

import type { IHandleResolver } from "@/server/features/xrpc/application/interfaces/handle-resolver.js";
import { ResolvedAtUri } from "@/server/features/xrpc/domain/models/at-uri.js";

export class AtUriService {
  constructor(private readonly handleResolver: IHandleResolver) {}
  static inject = ["handleResolver"] as const;

  async resolveHostname(uri: AtUri): Promise<ResolvedAtUri> {
    if (isDid(uri.hostname)) {
      return new ResolvedAtUri(uri);
    }

    if (!isHandle(uri.hostname)) {
      throw new InvalidHostnameError(uri);
    }

    const handle = await this.handleResolver.resolve(uri.hostname);
    return ResolvedAtUri.make(handle, uri.collection, uri.rkey);
  }
}

export class AtUriServiceError extends Error {}

export class InvalidHostnameError extends AtUriServiceError {
  constructor(uri: AtUri) {
    super(`Invalid hostname in URI: ${uri.toString()}`);
    this.name = "InvalidHostnameError";
  }
}
