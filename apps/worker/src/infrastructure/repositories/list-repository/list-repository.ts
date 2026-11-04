import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";

import type { IListRepository } from "../../../application/interfaces/repositories/list-repository.js";
import type { List } from "../../../application/models/list.js";
import { sanitizeDate } from "../../utils/data-sanitizer.js";

export class ListRepository implements IListRepository {
  async save({ ctx, list }: { ctx: TransactionContext; list: List }) {
    const { uri, indexedAt, ...rest } = list;
    const data = {
      ...rest,
      createdAt: sanitizeDate(rest.createdAt),
    };
    await ctx.db
      .insert(schema.lists)
      .values({ uri, indexedAt, ...data })
      .onConflictDoUpdate({ target: schema.lists.uri, set: data });
  }
}
