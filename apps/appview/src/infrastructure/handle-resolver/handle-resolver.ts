import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/interface";
import { asHandle, type Handle, required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import {
  HandleResolutionError,
  type IHandleResolver,
} from "../../application/interfaces/handle-resolver.js";

export class HandleResolver implements IHandleResolver {
  constructor(private readonly db: DatabaseClient) {}

  async resolve(handle: Handle): Promise<Did> {
    const [account] = await this.db
      .select({
        did: schema.accounts.did,
      })
      .from(schema.accounts)
      .where(eq(schema.accounts.handle, handle))
      .limit(1);
    if (!account) {
      throw new HandleResolutionError(handle);
    }
    return asDid(account.did);
  }

  async resolveMany(handles: Handle[]) {
    const accounts = await this.db
      .select({
        did: schema.accounts.did,
        handle: schema.accounts.handle,
      })
      .from(schema.accounts)
      .where(inArray(schema.accounts.handle, handles));
    return accounts.reduce<Record<Handle, Did>>((acc, account) => {
      // ハンドルで検索したのでハンドルは持っているはず
      acc[asHandle(required(account.handle))] = asDid(account.did);
      return acc;
    }, {});
  }
}
