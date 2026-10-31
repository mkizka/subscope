import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, gt, inArray, isNull, or } from "drizzle-orm";

import type { LabelDto } from "../../application/dto/label-dto.js";
import type { ILabelQuery } from "../../application/interfaces/label-query.js";

export class LabelQuery implements ILabelQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findBySubjects(uris: string[]): Promise<LabelDto[]> {
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
