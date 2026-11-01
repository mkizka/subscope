import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq } from "drizzle-orm";

import type {
  ILabelRepository,
  LabelData,
} from "../../../application/interfaces/repositories/label-repository.js";

export class LabelRepository implements ILabelRepository {
  async upsert({
    ctx,
    label,
    actorDid,
  }: {
    ctx: TransactionContext;
    label: LabelData;
    actorDid: Did;
  }) {
    const data = {
      cid: label.cid ?? null,
      cts: new Date(label.cts),
      exp: label.exp ? new Date(label.exp) : null,
    };
    await ctx.db
      .insert(schema.labels)
      .values({
        src: label.src,
        uri: label.uri,
        val: label.val,
        actorDid,
        ...data,
      })
      .onConflictDoUpdate({
        target: [schema.labels.src, schema.labels.uri, schema.labels.val],
        set: data,
      });
  }

  async delete({ ctx, label }: { ctx: TransactionContext; label: LabelData }) {
    await ctx.db
      .delete(schema.labels)
      .where(
        and(
          eq(schema.labels.src, label.src),
          eq(schema.labels.uri, label.uri),
          eq(schema.labels.val, label.val),
        ),
      );
  }
}
