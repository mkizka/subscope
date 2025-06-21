import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { asHandle, type Handle, required } from "@repo/common/utils";
import { schema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import {
  HandleResolutionError,
  type IHandleResolver,
} from "../application/interfaces/handle-resolver.js";

export class HandleResolver implements IHandleResolver {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async resolve(handle: Handle): Promise<Did> {
    const [actor] = await this.db
      .select({
        did: schema.actors.did,
      })
      .from(schema.actors)
      .where(eq(schema.actors.handle, handle))
      .limit(1);
    if (!actor) {
      throw new HandleResolutionError(handle);
    }
    return asDid(required(actor.did));
  }

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
