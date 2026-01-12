import type { Did } from "@atproto/did";
import { asDid, isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { SupportedCollection } from "@repo/common/utils";
import { asSupportedCollection } from "@repo/common/utils";

export class ResolvedAtUri {
  private readonly value: AtUri;

  constructor(uri: AtUri | string) {
    this.value = typeof uri === "string" ? new AtUri(uri) : uri;
    this.validate();
  }

  private validate(): void {
    if (!isDid(this.value.host)) {
      throw new Error(`Invalid DID in AtUri: ${this.value.toString()}`);
    }
  }

  static make(did: string, collection?: string, rkey?: string): ResolvedAtUri {
    return new ResolvedAtUri(AtUri.make(did, collection, rkey));
  }

  getDid(): Did {
    return asDid(this.value.host);
  }

  getCollection(): SupportedCollection {
    return asSupportedCollection(this.value.collection);
  }

  getValue(): AtUri {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }
}
