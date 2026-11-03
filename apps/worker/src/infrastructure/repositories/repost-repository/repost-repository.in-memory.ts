import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IRepostRepository } from "../../../application/interfaces/repositories/repost-repository.js";
import type { RepostRow } from "../../../application/record-parsers.js";

export class InMemoryRepostRepository implements IRepostRepository {
  private reposts: Map<string, RepostRow> = new Map();

  add(repost: RepostRow): void {
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
  }): Promise<RepostRow | null> {
    return this.reposts.get(uri.toString()) ?? null;
  }

  async save({
    repost,
  }: {
    ctx: TransactionContext;
    repost: RepostRow;
  }): Promise<void> {
    this.reposts.set(repost.uri, repost);
  }
}
