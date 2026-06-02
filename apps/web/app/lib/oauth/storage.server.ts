import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import { db } from "./db.server.js";

class StateStore implements NodeSavedStateStore {
  async get(key: string): Promise<NodeSavedState | undefined> {
    const [result] = await db
      .select()
      .from(schema.authState)
      .where(eq(schema.authState.key, key))
      .limit(1);
    if (result === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(result.state);
  }

  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);
    await db
      .insert(schema.authState)
      .values({ key, state })
      .onConflictDoUpdate({
        target: schema.authState.key,
        set: { state },
      });
  }

  async del(key: string) {
    await db.delete(schema.authState).where(eq(schema.authState.key, key));
  }
}

class SessionStore implements NodeSavedSessionStore {
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const [result] = await db
      .select()
      .from(schema.authSession)
      .where(eq(schema.authSession.key, key))
      .limit(1);
    if (result === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(result.session);
  }

  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);
    await db
      .insert(schema.authSession)
      .values({ key, session })
      .onConflictDoUpdate({
        target: schema.authSession.key,
        set: { session },
      });
  }

  async del(key: string) {
    await db.delete(schema.authSession).where(eq(schema.authSession.key, key));
  }
}

export const stateStore = new StateStore();
export const sessionStore = new SessionStore();
