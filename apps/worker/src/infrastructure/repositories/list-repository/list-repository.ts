import type { List, TransactionContext } from "@repo/common/domain";
import { type ListInsert, schema } from "@repo/db";

import type { IListRepository } from "../../../application/interfaces/repositories/list-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class ListRepository implements IListRepository {
  async save({ ctx, list }: { ctx: TransactionContext; list: List }) {
    const data = {
      cid: list.cid,
      actorDid: list.actorDid,
      purpose: list.purpose,
      name: list.name,
      description: list.description,
      avatarCid: list.avatarCid,
      createdAt: sanitizeDate(list.createdAt),
    } satisfies ListInsert;
    await ctx.db
      .insert(schema.lists)
      .values({
        uri: list.uri.toString(),
        indexedAt: list.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.lists.uri,
        set: data,
      });
  }
}
