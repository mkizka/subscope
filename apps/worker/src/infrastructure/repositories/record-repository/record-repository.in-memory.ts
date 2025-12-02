import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@repo/common/domain";

import type { IRecordRepository } from "../../../application/interfaces/repositories/record-repository.js";

export class InMemoryRecordRepository implements IRecordRepository {
  private records: Map<string, Record> = new Map();

  add(record: Record): void {
    this.records.set(record.uri.toString(), record);
  }

  clear(): void {
    this.records.clear();
  }

  get(uri: string): Record | undefined {
    return this.records.get(uri);
  }

  getAll(): Record[] {
    return Array.from(this.records.values());
  }

  async findByUri({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Record | null> {
    return this.records.get(uri.toString()) ?? null;
  }

  async upsert({
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<void> {
    this.records.set(record.uri.toString(), record);
  }

  async delete({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<void> {
    this.records.delete(uri.toString());
  }
}
