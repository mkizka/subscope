import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IRepostRepository } from "../../../application/interfaces/repositories/repost-repository.js";
import type { Repost } from "../../../application/models/repost.js";

export class InMemoryRepostRepository implements IRepostRepository {
  private reposts: Map<string, Repost> = new Map();

  add(repost: Repost): void {
    this.reposts.set(repost.uri, repost);
  }

  clear(): void {
    this.reposts.clear();
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Repost | null> {
    return this.reposts.get(uri.toString()) ?? null;
  }

  async save({
    repost,
  }: {
    ctx: TransactionContext;
    repost: Repost;
  }): Promise<void> {
    this.reposts.set(repost.uri, repost);
  }
}
