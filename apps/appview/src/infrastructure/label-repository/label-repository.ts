import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, gt, inArray, isNull, or } from "drizzle-orm";

import type { ILabelRepository } from "../../application/interfaces/label-repository.js";

export class LabelRepository implements ILabelRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findBySubjects(uris: string[]) {
    if (uris.length === 0) return [];
    return await this.db
      .select({
        src: schema.labels.src,
        uri: schema.labels.uri,
        val: schema.labels.val,
      })
      .from(schema.labels)
      .where(
        and(
          inArray(schema.labels.uri, uris),
          or(isNull(schema.labels.exp), gt(schema.labels.exp, new Date())),
        ),
      );
  }
}
