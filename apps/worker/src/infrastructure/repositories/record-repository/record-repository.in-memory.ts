import type { AtUri } from "@atproto/syntax";
import type { Record, TransactionContext } from "@repo/common/domain";

import type { IRecordRepository } from "../../../application/interfaces/repositories/record-repository.js";

export class InMemoryRecordRepository implements IRecordRepository {
  private records: Map<string, Record> = new Map();
  private revs: Map<string, string> = new Map();

  add(record: Record): void {
    this.records.set(record.uri.toString(), record);
  }

  clear(): void {
    this.records.clear();
    this.revs.clear();
  }

  findAll(): Record[] {
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

  async claimRev({
    uri,
    rev,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
    rev: string;
  }): Promise<boolean> {
    const current = this.revs.get(uri.toString());
    if (current !== undefined && current >= rev) {
      return false;
    }
    this.revs.set(uri.toString(), rev);
    return true;
  }
}
