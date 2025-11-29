import type { AtUri } from "@atproto/syntax";
import type { Record } from "@repo/common/domain";

import type { IRecordRepository } from "../../application/interfaces/record-repository.js";

export class InMemoryRecordRepository implements IRecordRepository {
  private records: Map<string, Record> = new Map();

  add(record: Record): void {
    this.records.set(record.uri.toString(), record);
  }

  clear(): void {
    this.records.clear();
  }

  async findByUris(uris: AtUri[]): Promise<Record[]> {
    const uriStrings = uris.map((uri) => uri.toString());
    return Array.from(this.records.values()).filter((record) =>
      uriStrings.includes(record.uri.toString()),
    );
  }
}
