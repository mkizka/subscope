import type { ListItem, TransactionContext } from "@repo/common/domain";
import { type ListItemInsert, schema } from "@repo/db";

import type { IListItemRepository } from "../../../application/interfaces/repositories/list-item-repository.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class ListItemRepository implements IListItemRepository {
  async upsert({
    ctx,
    listItem,
  }: {
    ctx: TransactionContext;
    listItem: ListItem;
  }) {
    const data = {
      cid: listItem.cid,
      actorDid: listItem.actorDid,
      listUri: listItem.listUri.toString(),
      subjectDid: listItem.subjectDid,
      createdAt: sanitizeDate(listItem.createdAt),
    } satisfies ListItemInsert;
    await ctx.db
      .insert(schema.listItems)
      .values({
        uri: listItem.uri.toString(),
        indexedAt: listItem.indexedAt,
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.listItems.uri,
        set: data,
      });
  }
}
