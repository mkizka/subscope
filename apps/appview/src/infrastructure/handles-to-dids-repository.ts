import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@dawn/common/domain";
import { asHandle, type Handle } from "@dawn/common/utils";
import { schema } from "@dawn/db";
import { inArray } from "drizzle-orm/mysql-core/expressions";

import type { IHandlesToDidsRepository } from "../application/interfaces/handles-to-dids-repository.js";

export class HandlesToDidsRepository implements IHandlesToDidsRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findDidsByHandle(handles: Handle[]) {
    const users = await this.db
      .select({
        did: schema.users.did,
        handle: schema.users.handle,
      })
      .from(schema.users)
      .where(inArray(schema.users.handle, handles));
    return users.reduce<Record<Handle, Did>>((acc, user) => {
      acc[asHandle(user.handle)] = asDid(user.did);
      return acc;
    }, {});
  }
}
