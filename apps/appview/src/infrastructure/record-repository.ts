import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { inArray } from "drizzle-orm";

import type { IRecordRepository } from "../application/interfaces/record-repository.js";

export class RecordRepository implements IRecordRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany(uris: AtUri[]): Promise<Record[]> {
    const stringUris = uris.map((uri) => uri.toString());
    const records = await this.db
      .select()
      .from(schema.record)
      .where(inArray(schema.record.uri, stringUris));
    return records.map(
      (record) =>
        new Record({
          uri: record.uri,
          cid: record.cid,
          json: record.json,
          indexedAt: record.indexedAt,
        }),
    );
  }
}
