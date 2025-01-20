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
    const actors = await this.db
      .select({
        did: schema.actors.did,
        handle: schema.actors.handle,
      })
      .from(schema.actors)
      .where(inArray(schema.actors.handle, handles));
    return actors.reduce<Record<Handle, Did>>((acc, actor) => {
      acc[asHandle(actor.handle)] = asDid(actor.did);
      return acc;
    }, {});
  }
}
