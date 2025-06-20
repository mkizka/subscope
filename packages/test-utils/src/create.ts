import type { DatabaseClient } from "@repo/common/domain";
import type { TableConfig } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

// https://github.com/factory-js/factory-js/blob/2c003b1895c3f5098e2e3d890ae9d310598a78d6/examples/basic/factories/utils/create.ts
export const create = async <T extends TableConfig>(
  db: DatabaseClient,
  table: PgTable<T>,
  props: PgTable<T>["$inferInsert"],
): Promise<PgTable<T>["$inferSelect"]> => {
  const models = await db.insert(table).values(props).returning();
  if (!Array.isArray(models)) {
    throw Error("Failed to insert.");
  }
  return models[0];
};
