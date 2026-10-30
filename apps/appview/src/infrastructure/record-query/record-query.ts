import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { RecordDto } from "../../application/dto/record-dto.js";
import type { IRecordQuery } from "../../application/interfaces/record-query.js";

export class RecordQuery implements IRecordQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findRecords(uris: AtUri[]): Promise<RecordDto[]> {
    if (uris.length === 0) {
      return [];
    }
    return await this.db
      .select({
        uri: schema.records.uri,
        cid: schema.records.cid,
        json: schema.records.json,
      })
      .from(schema.records)
      .where(
        inArray(
          schema.records.uri,
          uris.map((uri) => uri.toString()),
        ),
      );
  }
}
