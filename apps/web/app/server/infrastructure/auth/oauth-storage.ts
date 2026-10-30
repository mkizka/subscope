import type {
  NodeSavedSessionStore,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

export const stateStoreFactory = ({
  db,
}: {
  db: DatabaseClient;
}): NodeSavedStateStore => ({
  async get(key) {
    const [result] = await db
      .select()
      .from(schema.authState)
      .where(eq(schema.authState.key, key))
      .limit(1);
    if (result === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(result.state);
  },
  async set(key, val) {
    const state = JSON.stringify(val);
    await db
      .insert(schema.authState)
      .values({ key, state })
      .onConflictDoUpdate({ target: schema.authState.key, set: { state } });
  },
  async del(key) {
    await db.delete(schema.authState).where(eq(schema.authState.key, key));
  },
});

export const sessionStoreFactory = ({
  db,
}: {
  db: DatabaseClient;
}): NodeSavedSessionStore => ({
  async get(key) {
    const [result] = await db
      .select()
      .from(schema.authSession)
      .where(eq(schema.authSession.key, key))
      .limit(1);
    if (result === undefined) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(result.session);
  },
  async set(key, val) {
    const session = JSON.stringify(val);
    await db
      .insert(schema.authSession)
      .values({ key, session })
      .onConflictDoUpdate({ target: schema.authSession.key, set: { session } });
  },
  async del(key) {
    await db.delete(schema.authSession).where(eq(schema.authSession.key, key));
  },
});
