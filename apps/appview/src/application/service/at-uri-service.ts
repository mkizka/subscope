import { isDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import { isHandle } from "@repo/common/utils";

import { ResolvedAtUri } from "../../domain/models/at-uri.js";
import type { IHandleResolver } from "../interfaces/handle-resolver.js";

export class AtUriService {
  constructor(private readonly handleResolver: IHandleResolver) {}

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
