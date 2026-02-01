import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { IRecordRepository } from "../../application/interfaces/record-repository.js";

export class RecordRepository implements IRecordRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findByUris(uris: AtUri[]): Promise<Record[]> {
    const stringUris = uris.map((uri) => uri.toString());
    const records = await this.db
      .select()
      .from(schema.records)
      .where(inArray(schema.records.uri, stringUris));
    return records.map((record) =>
      Record.reconstruct({
        uri: record.uri,
        cid: record.cid,
        json: record.json,
        indexedAt: record.indexedAt,
      }),
    );
  }
}
