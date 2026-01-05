import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

export class StateStore implements NodeSavedStateStore {
  constructor(private db: DatabaseClient) {}
  static inject = ["db"] as const;

  async get(key: string): Promise<NodeSavedState | undefined> {
    const [result] = await this.db
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
    await this.db
      .insert(schema.authState)
      .values({ key, state })
      .onConflictDoUpdate({
        target: schema.authState.key,
        set: { state },
      });
  }

  async del(key: string) {
    await this.db.delete(schema.authState).where(eq(schema.authState.key, key));
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private db: DatabaseClient) {}
  static inject = ["db"] as const;

  async get(key: string): Promise<NodeSavedSession | undefined> {
    const [result] = await this.db
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
    await this.db
      .insert(schema.authSession)
      .values({ key, session })
      .onConflictDoUpdate({
        target: schema.authSession.key,
        set: { session },
      });
  }

  async del(key: string) {
    await this.db
      .delete(schema.authSession)
      .where(eq(schema.authSession.key, key));
  }
}
