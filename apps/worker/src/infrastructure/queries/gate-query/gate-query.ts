import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";

import type { IRecordRepository } from "../../../application/interfaces/repositories/record-repository.js";
import { Gate } from "../../../domain/gate.js";
import type { IGateQuery } from "../../../domain/interfaces/gate-query.js";
import { Post } from "../../../domain/post.js";

export class GateQuery implements IGateQuery {
  constructor(private readonly recordRepository: IRecordRepository) {}

  findPostgate(ctx: TransactionContext, postUri: AtUri) {
    return this.findGate(ctx, {
      postUri,
      collection: "app.bsky.feed.postgate",
    });
  }

  findThreadgate(ctx: TransactionContext, rootUri: AtUri) {
    return this.findGate(ctx, {
      postUri: rootUri,
      collection: "app.bsky.feed.threadgate",
    });
  }

  async findPost(ctx: TransactionContext, uri: AtUri) {
    const record = await this.recordRepository.find({ ctx, uri });
    return record && Post.fromRecord(record);
  }

  async follows(
    ctx: TransactionContext,
    { accountDid, subjectDid }: { accountDid: string; subjectDid: string },
  ) {
    const rows = await ctx.db
      .select({ uri: schema.follows.uri })
      .from(schema.follows)
      .where(
        and(
          eq(schema.follows.accountDid, accountDid),
          eq(schema.follows.subjectDid, subjectDid),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async isListed(
    ctx: TransactionContext,
    { listUris, subjectDid }: { listUris: string[]; subjectDid: string },
  ) {
    const rows = await ctx.db
      .select({ uri: schema.listItems.uri })
      .from(schema.listItems)
      .where(
        and(
          inArray(schema.listItems.listUri, listUris),
          eq(schema.listItems.subjectDid, subjectDid),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  private async findGate(
    ctx: TransactionContext,
    { postUri, collection }: { postUri: AtUri; collection: string },
  ) {
    const record = await this.recordRepository.find({
      ctx,
      uri: AtUri.make(postUri.hostname, collection, postUri.rkey),
    });
    return record && Gate.fromRecord(record);
  }
}
