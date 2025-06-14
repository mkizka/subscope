import { isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { asHandle, isHandle } from "@repo/common/utils";

import type { IHandlesToDidsRepository } from "../interfaces/handles-to-dids-repository.js";

export class AtUriService {
  constructor(
    private readonly handlesToDidsRepository: IHandlesToDidsRepository,
  ) {}
  static inject = ["handlesToDidsRepository"] as const;

  async resolveHostname(uri: AtUri): Promise<AtUri> {
    if (isDid(uri.hostname)) {
      return uri;
    }

    if (!isHandle(uri.hostname)) {
      throw new InvalidHostnameError(uri);
    }

    const handle = asHandle(uri.hostname);
    const handleToDids = await this.handlesToDidsRepository.findDidsByHandle([
      handle,
    ]);
    const did = handleToDids[handle];

    if (!did) {
      throw new HandleResolutionError(handle);
    }
    return AtUri.make(did, uri.collection, uri.rkey);
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
