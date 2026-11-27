import assert from "node:assert";
import { once } from "node:events";

import { asDid } from "@atproto/did";
import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
} from "@repo/common/test";
import { schema } from "@repo/db";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { InMemoryCursorStore } from "../infrastructure/cursor-store/cursor-store.in-memory.js";
import { InMemoryLabelFetcher } from "../infrastructure/fetchers/label-fetcher.in-memory.js";
import { InMemoryTapClient } from "../infrastructure/tap-client/tap-client.in-memory.js";
import { createWorkerRegistry } from "../shared/registry.js";
import { testEnv } from "../shared/test-utils.js";
import { JetstreamSubscriber } from "./jetstream.js";

// prettier-ignore
const services = await createWorkerRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("tapClient", asClassArgs(InMemoryTapClient))
  .replaceService("labelFetcher", asClassArgs(InMemoryLabelFetcher))
  .replaceService("cursorStore", asClassArgs(InMemoryCursorStore))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("syncWorker", {} as never)
  .resolve();

const NSID = "network.bsky.jetstream.subscribeEvents";
const cid = "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm";

let seq = 0;

const message = (type: string, payload: object) => ({
  $type: "message",
  payload: {
    $type: `${NSID}#${type}`,
    seq: ++seq,
    time: new Date().toISOString(),
    ...payload,
  },
});

const postEvent = (did: string, overrides: object = {}) =>
  message("commit", {
    did,
    operation: "create",
    collection: "app.bsky.feed.post",
    rkey: "3l3qo2vuowo2b",
    rev: "3l3qo2vutsw2b",
    cid,
    record: {
      $type: "app.bsky.feed.post",
      text: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  });

const followEvent = (did: string, subject: string) =>
  postEvent(did, {
    collection: "app.bsky.graph.follow",
    record: {
      $type: "app.bsky.graph.follow",
      subject,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });

describe("Jetstreamからのイベント受信", () => {
  const { ctx } = testSetup;
  let server: WebSocketServer;
  let jetstreamUrl: string;

  const connect = () => {
    const connection = new Promise<[WebSocket, URL]>((resolve) =>
      server.once("connection", (socket, req) =>
        resolve([socket, new URL(req.url ?? "", jetstreamUrl)]),
      ),
    );
    const subscriber = new JetstreamSubscriber({
      ...services,
      env: { JETSTREAM_URL: jetstreamUrl },
    });
    void subscriber.start();
    return connection;
  };

  const send = (socket: WebSocket, ...events: object[]) => {
    for (const event of events) socket.send(JSON.stringify(event));
  };

  const createMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

  const createTracked = async () => {
    const member = await createMember();
    const tracked = await accountFactory(ctx.db).create();
    const follow = await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => member })
            .create(),
        followee: () => tracked,
      })
      .create();
    return { member, tracked, follow };
  };

  const findPosts = (did: string) =>
    ctx.db.select().from(schema.posts).where(eq(schema.posts.accountDid, did));

  const findFollows = (did: string) =>
    ctx.db
      .select()
      .from(schema.follows)
      .where(eq(schema.follows.accountDid, did));

  const findAccount = async (did: string) => {
    const [found] = await ctx.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did));
    return found;
  };

  beforeEach(async () => {
    services.cursorStore.clear();
    server = new WebSocketServer({ port: 0 });
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    jetstreamUrl = `http://localhost:${address.port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const client of server.clients) {
      client.close(1000);
    }
    await new Promise((resolve) => server.close(resolve));
  });

  test("jetstream-2: メンバーのレコードは保存しない", async () => {
    // arrange
    const { member, tracked } = await createTracked();
    const [socket] = await connect();

    // act
    send(socket, postEvent(member.did), postEvent(tracked.did));

    // assert
    await vi.waitFor(async () =>
      expect(await findPosts(tracked.did)).toHaveLength(1),
    );
    expect(await findPosts(member.did)).toEqual([]);
  });

  test("jetstream-3: メンバーでも追跡アカウントでもないアカウントのレコードは、メンバー宛てのものだけ保存する", async () => {
    // arrange
    const member = await createMember();
    const other = await accountFactory(ctx.db).create();
    const stranger = await accountFactory(ctx.db).create();
    const [socket] = await connect();

    // act
    send(
      socket,
      postEvent(other.did),
      followEvent(other.did, stranger.did),
      followEvent(other.did, member.did),
    );

    // assert
    await vi.waitFor(async () =>
      expect(await findFollows(other.did)).toEqual([
        expect.objectContaining({ subjectDid: member.did }),
      ]),
    );
    expect(await findPosts(other.did)).toEqual([]);
  });

  test("jetstream-4: 保存済みのレコードが削除されたら削除する", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket] = await connect();
    send(socket, postEvent(tracked.did));
    await vi.waitFor(async () =>
      expect(await findPosts(tracked.did)).toHaveLength(1),
    );

    // act
    send(socket, postEvent(tracked.did, { operation: "delete" }));

    // assert
    await vi.waitFor(async () =>
      expect(await findPosts(tracked.did)).toEqual([]),
    );
  });

  test("jetstream-5: 追跡アカウントのハンドルを保存する", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket] = await connect();

    // act
    send(
      socket,
      message("identity", {
        did: tracked.did,
        identity: { did: tracked.did, handle: "renamed.test" },
      }),
    );

    // assert
    await vi.waitFor(async () =>
      expect((await findAccount(tracked.did))?.handle).toBe("renamed.test"),
    );
  });

  test("jetstream-6: 追跡アカウントの状態を保存する", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket] = await connect();

    // act
    send(
      socket,
      message("account", {
        did: tracked.did,
        account: { did: tracked.did, active: false, status: "takendown" },
      }),
    );

    // assert
    await vi.waitFor(async () =>
      expect((await findAccount(tracked.did))?.status).toBe("takendown"),
    );
  });

  test("jetstream-7: 最後に処理したイベントの時刻を保存し、再接続時はその続きから受け取る", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket, firstUrl] = await connect();
    const time = "2026-01-01T00:00:00.000Z";

    // act
    send(socket, postEvent(tracked.did, { time }));
    await vi.waitFor(async () =>
      expect(await services.cursorStore.getCursor(jetstreamUrl)).toBe(
        new Date(time).getTime() * 1000,
      ),
    );
    const [, secondUrl] = await connect();

    // assert
    expect(firstUrl.searchParams.has("cursor")).toBe(false);
    expect(secondUrl.searchParams.get("cursor")).toBe(
      String(new Date(time).getTime() * 1000),
    );
  });

  test("jetstream-8: DBに保存できなかったイベントは、接続し直して受け取り直す", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket] = await connect();
    const event = postEvent(tracked.did);
    const reconnection = new Promise<WebSocket>((resolve) =>
      server.once("connection", resolve),
    );
    vi.spyOn(services.transactionManager, "transaction").mockRejectedValueOnce(
      new Error("db down"),
    );

    // act
    send(socket, event);
    send(await reconnection, event);

    // assert
    await vi.waitFor(async () =>
      expect(await findPosts(tracked.did)).toHaveLength(1),
    );
  });

  test("jetstream-9: メンバーがフォローしたアカウントの、以後のレコードを保存する", async () => {
    // arrange
    const member = await createMember();
    const followee = await accountFactory(ctx.db).create();
    const [socket] = await connect();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => member })
            .create(),
        followee: () => followee,
      })
      .create();

    // act
    await services.syncTapRepoUseCase.execute({ did: asDid(followee.did) });
    send(socket, postEvent(followee.did));

    // assert
    await vi.waitFor(async () =>
      expect(await findPosts(followee.did)).toHaveLength(1),
    );
  });

  test("jetstream-10: メンバーの誰もフォローしなくなったアカウントの、以後のレコードは、メンバー宛てのものだけ保存する", async () => {
    // arrange
    const { member, tracked, follow } = await createTracked();
    const [socket] = await connect();
    await ctx.db
      .delete(schema.follows)
      .where(eq(schema.follows.uri, follow.uri));

    // act
    await services.syncTapRepoUseCase.execute({ did: asDid(tracked.did) });
    send(socket, postEvent(tracked.did), followEvent(tracked.did, member.did));

    // assert
    await vi.waitFor(async () =>
      expect(await findFollows(tracked.did)).toHaveLength(1),
    );
    expect(await findPosts(tracked.did)).toEqual([]);
  });

  test("jetstream-11: 保存した時刻がJetstreamのさかのぼれる期間より古いときは、欠けた期間をログとメトリクスに出す", async () => {
    // arrange
    const { tracked } = await createTracked();
    await services.cursorStore.setCursor(
      jetstreamUrl,
      new Date("2026-01-01T00:00:00.000Z").getTime() * 1000,
    );
    const logger = services.loggerManager.createLogger("test");
    const warn = vi.spyOn(logger, "warn");
    vi.spyOn(services.loggerManager, "createLogger").mockReturnValue(logger);
    const [socket] = await connect();

    // act
    send(
      socket,
      {
        $type: "message",
        payload: { $type: `${NSID}#info`, name: "OutdatedCursor" },
      },
      postEvent(tracked.did, { time: "2026-01-03T00:00:00.000Z" }),
    );

    // assert
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        { from: "2026-01-01T00:00:00.000Z", to: "2026-01-03T00:00:00.000Z" },
        expect.any(String),
      ),
    );
    expect(await services.metricReporter.getMetrics()).toContain(
      "worker_jetstream_gap_total 1",
    );
  });

  test("jetstream-12: Jetstreamから受け取ったレコードでは、アカウントのrevを記録しない", async () => {
    // arrange
    const { tracked } = await createTracked();
    const [socket] = await connect();

    // act
    send(socket, postEvent(tracked.did));

    // assert
    await vi.waitFor(async () =>
      expect(await findPosts(tracked.did)).toHaveLength(1),
    );
    expect((await findAccount(tracked.did))?.rev).toBeNull();
  });
});
