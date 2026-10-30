import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import type { Column } from "drizzle-orm";
import { and, eq, gt, inArray, isNull, notExists, or } from "drizzle-orm";

export const notTakenDown = (db: DatabaseClient, uri: Column, vals: string[]) =>
  notExists(
    db
      .select({ uri: schema.labels.uri })
      .from(schema.labels)
      .where(
        and(
          eq(schema.labels.uri, uri),
          inArray(schema.labels.val, vals),
          or(isNull(schema.labels.exp), gt(schema.labels.exp, new Date())),
        ),
      ),
  );
