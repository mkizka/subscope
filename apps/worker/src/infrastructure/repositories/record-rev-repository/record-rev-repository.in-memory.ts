import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IRecordRevRepository } from "../../../application/interfaces/repositories/record-rev-repository.js";

export class InMemoryRecordRevRepository implements IRecordRevRepository {
  private revs: Map<string, string> = new Map();

  async saveIfNewer({
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
