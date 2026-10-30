import type { AtUri } from "@atproto/syntax";

import type { RecordDto } from "../../application/dto/record-dto.js";
import type { IRecordQuery } from "../../application/interfaces/record-query.js";

export class InMemoryRecordQuery implements IRecordQuery {
  private records: Map<string, RecordDto> = new Map();

  add(record: { uri: AtUri; cid: string; json: unknown }): void {
    const uri = record.uri.toString();
    this.records.set(uri, { uri, cid: record.cid, json: record.json });
  }

  clear(): void {
    this.records.clear();
  }

  findRecords(uris: AtUri[]): Promise<RecordDto[]> {
    return Promise.resolve(
      uris.flatMap((uri) => this.records.get(uri.toString()) ?? []),
    );
  }
}
