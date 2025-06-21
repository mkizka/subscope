import { isDid } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import { isHandle } from "@repo/common/utils";

import type { IHandleResolver } from "../../application/interfaces/handle-resolver.js";
import { ResolvedAtUri } from "../models/at-uri.js";

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

    const didMap = await this.handleResolver.resolveMany([uri.hostname]);
    const did = didMap[uri.hostname];

    if (!did) {
      throw new HandleResolutionError(uri.hostname);
    }
    return ResolvedAtUri.make(did, uri.collection, uri.rkey);
  }
}

export class AtUriServiceError extends Error {}

export class InvalidHostnameError extends AtUriServiceError {
  constructor(uri: AtUri) {
    super(`Invalid hostname in URI: ${uri.toString()}`);
    this.name = "InvalidHostnameError";
  }
}

export class HandleResolutionError extends AtUriServiceError {
  constructor(handle: string) {
    super(`Failed to resolve handle: ${handle}`);
    this.name = "HandleResolutionError";
  }
}
