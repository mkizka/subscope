import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { asHandle, type Handle, required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { IHandleResolver } from "../application/interfaces/handle-resolver.js";

export class HandleResolver implements IHandleResolver {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async resolveMany(handles: Handle[]) {
    const actors = await this.db
      .select({
        did: schema.actors.did,
        handle: schema.actors.handle,
      })
      .from(schema.actors)
      .where(inArray(schema.actors.handle, handles));
    return actors.reduce<Record<Handle, Did>>((acc, actor) => {
      // ハンドルで検索したのでハンドルは持っているはず
      acc[asHandle(required(actor.handle))] = asDid(actor.did);
      return acc;
    }, {});
  }
}
