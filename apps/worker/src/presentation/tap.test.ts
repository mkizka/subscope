import assert from "node:assert";
import { once } from "node:events";

import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
} from "@repo/common/test";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { z } from "zod";

import { createWorkerRegistry } from "../shared/registry.js";
import { testEnv } from "../shared/test-utils.js";
import { TapSubscriber } from "./tap.js";

// prettier-ignore
const services = await createWorkerRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("tapClient", asClassArgs(InMemoryTapClient))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("syncWorker", {} as never)
  .resolve();

const cid = "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm";

const recordEvent = (id: number, did: string, record: object = {}) => ({
  id,
  type: "record",
  record: {
    did,
    rev: "3l3qo2vutsw2b",
    collection: "app.bsky.feed.post",
    rkey: "3l3qo2vuowo2b",
    action: "create",
    record: {
      $type: "app.bsky.feed.post",
      text: "hello",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    cid,
    live: true,
    ...record,
  },
});

describe("Tapからのイベント受信", () => {
  const { ctx } = testSetup;
  let server: WebSocketServer;
  let socket: WebSocket;
  let acks: number[];

  const connect = async (tapConcurrency = 64) => {
    acks = [];
    server = new WebSocketServer({ port: 0 });
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    const connection = new Promise<WebSocket>((resolve) =>
      server.once("connection", resolve),
    );
    const subscriber = new TapSubscriber(
      services.loggerManager,
      services.metricReporter,
      services.indexCommitUseCase,
      services.upsertIdentityUseCase,
      `http://localhost:${address.port}`,
      tapConcurrency,
    );
    void subscriber.start();
    socket = await connection;
    socket.on("message", (data) => {
      assert(Buffer.isBuffer(data));
      const { id } = z
        .object({ id: z.number() })
        .parse(JSON.parse(data.toString()));
      acks.push(id);
    });
  };

  const send = (...events: object[]) => {
    for (const event of events) socket.send(JSON.stringify(event));
  };

  const findPosts = (did: string) =>
    ctx.db.select().from(schema.posts).where(eq(schema.posts.actorDid, did));

  afterEach(async () => {
    vi.restoreAllMocks();
    socket.close(1000);
    await new Promise((resolve) => server.close(resolve));
  });

  test("channel-1: recordイベントはインデックスを、identityイベントはアカウントの状態の保存を終えてからTapにackする", async () => {
    // arrange
    await connect();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();

    // act
    send(recordEvent(1, actor.did), {
      id: 2,
      type: "identity",
      identity: {
        did: actor.did,
        handle: "alice.test",
        is_active: false,
        status: "takendown",
      },
    });

    // assert
    await vi.waitFor(() => expect(acks.toSorted()).toEqual([1, 2]));
    expect(await findPosts(actor.did)).toHaveLength(1);
    const [found] = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, actor.did));
    expect(found?.status).toBe("takendown");
  });

  test("channel-2: サポートしないコレクションのrecordイベントは保存せずにackする", async () => {
    // arrange
    await connect();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();

    // act
    send(recordEvent(1, actor.did, { collection: "com.example.unknown" }));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await ctx.db.select().from(schema.records)).toEqual([]);
  });

  test("channel-3: DBに保存できなかったイベントはackしない", async () => {
    // arrange
    await connect();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    vi.spyOn(services.transactionManager, "transaction").mockRejectedValueOnce(
      new Error("db down"),
    );

    // act
    send(recordEvent(1, actor.did), recordEvent(2, actor.did));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([2]));
  });

  test("channel-4: スキーマに合わないレコードなど、処理しないと決めたイベントはackする", async () => {
    // arrange
    await connect();
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();

    // act
    send(
      recordEvent(1, actor.did, {
        record: { $type: "app.bsky.feed.post", text: "no createdAt" },
      }),
    );

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await findPosts(actor.did)).toEqual([]);
  });

  test("channel-5: 処理中のイベントがTAP_CONCURRENCY件に達したら、空くまで次のイベントを読まない", async () => {
    // arrange
    await connect(1);
    const actor = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const blocker = Promise.withResolvers<never>();
    const transaction = vi
      .spyOn(services.transactionManager, "transaction")
      .mockImplementationOnce(() => blocker.promise);

    // act
    send(recordEvent(1, actor.did), recordEvent(2, actor.did));
    await vi.waitFor(() => expect(transaction).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 200));

    // assert
    expect(transaction).toHaveBeenCalledOnce();
    blocker.reject(new Error("db down"));
    await vi.waitFor(() => expect(acks).toEqual([2]));
  });
});
