import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IListItemRepository } from "../../../application/interfaces/repositories/list-item-repository.js";
import type { ListItemRow } from "../../../application/record-parsers.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class ListItemRepository implements IListItemRepository {
  async save({
    ctx,
    listItem,
  }: {
    ctx: TransactionContext;
    listItem: ListItemRow;
  }) {
    const { uri, indexedAt, ...rest } = listItem;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.listItems)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.listItems.uri, set: data });
  }
}
