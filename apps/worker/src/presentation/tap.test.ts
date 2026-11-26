import assert from "node:assert";
import { once } from "node:events";

import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
} from "@repo/common/test";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { z } from "zod";

import { InMemoryTapClient } from "../infrastructure/tap-client/tap-client.in-memory.js";
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

  const connect = async () => {
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
      { TAP_URL: `http://localhost:${address.port}` },
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
    ctx.db.select().from(schema.posts).where(eq(schema.posts.accountDid, did));

  afterEach(async () => {
    vi.restoreAllMocks();
    socket.close(1000);
    await new Promise((resolve) => server.close(resolve));
  });

  test("channel-1: イベントは処理を終えてからTapにackする", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    send(recordEvent(1, account.did), {
      id: 2,
      type: "identity",
      identity: {
        did: account.did,
        handle: "alice.test",
        is_active: false,
        status: "takendown",
      },
    });

    // assert
    await vi.waitFor(() => expect(acks.toSorted()).toEqual([1, 2]));
    expect(await findPosts(account.did)).toHaveLength(1);
    const [found] = await ctx.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.did, account.did));
    expect(found?.status).toBe("takendown");
  });

  test("channel-2: サポートしないコレクションのrecordイベントは、保存せずにackする", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    send(recordEvent(1, account.did, { collection: "com.example.unknown" }));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await ctx.db.select().from(schema.records)).toEqual([]);
  });

  test("channel-3: DBに保存できなかったイベントはackしない", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    vi.spyOn(services.transactionManager, "transaction").mockRejectedValueOnce(
      new Error("db down"),
    );

    // act
    send(recordEvent(1, account.did), recordEvent(2, account.did));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([2]));
  });

  test("channel-4: スキーマに合わないレコードなど、処理しないと決めたイベントはackする", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    send(
      recordEvent(1, account.did, {
        record: { $type: "app.bsky.feed.post", text: "no createdAt" },
      }),
    );

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await findPosts(account.did)).toEqual([]);
  });

  test("channel-5: イベントは1件ずつ処理し、処理を終えるまで次のイベントを読まない", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const blocker = Promise.withResolvers<never>();
    const transaction = vi
      .spyOn(services.transactionManager, "transaction")
      .mockImplementationOnce(() => blocker.promise);

    // act
    send(recordEvent(1, account.did), recordEvent(2, account.did));
    await vi.waitFor(() => expect(transaction).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 200));

    // assert
    expect(transaction).toHaveBeenCalledOnce();
    blocker.reject(new Error("db down"));
    await vi.waitFor(() => expect(acks).toEqual([2]));
  });

  const findRev = async (did: string) => {
    const [found] = await ctx.db
      .select({ rev: schema.accounts.rev })
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did));
    return found?.rev;
  };

  test("repoRev-1: recordイベントを処理したら、そのアカウントのrevをイベントのrevにする", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db).create();

    // act
    send(recordEvent(1, account.did, { rev: "3aaaaaaaaaaaa" }));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await findRev(account.did)).toBe("3aaaaaaaaaaaa");
  });

  test("repoRev-2: 保存しないレコードやサポートしないコレクションのイベントでも、revを記録する", async () => {
    // arrange
    await connect();
    const unsupported = await accountFactory(ctx.db).create();
    const invalid = await accountFactory(ctx.db).create();

    // act
    send(
      recordEvent(1, unsupported.did, {
        rev: "3aaaaaaaaaaaa",
        collection: "com.example.unknown",
      }),
      recordEvent(2, invalid.did, {
        rev: "3bbbbbbbbbbbb",
        record: { $type: "app.bsky.feed.post", text: "no createdAt" },
      }),
    );

    // assert
    await vi.waitFor(() => expect(acks.toSorted()).toEqual([1, 2]));
    expect(await findRev(unsupported.did)).toBe("3aaaaaaaaaaaa");
    expect(await findRev(invalid.did)).toBe("3bbbbbbbbbbbb");
  });

  test("repoRev-3: 記録済みより古いrevでは更新しない", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db).create();
    await ctx.db
      .update(schema.accounts)
      .set({ rev: "3bbbbbbbbbbbb" })
      .where(eq(schema.accounts.did, account.did));

    // act
    send(recordEvent(1, account.did, { rev: "3aaaaaaaaaaaa" }));

    // assert
    await vi.waitFor(() => expect(acks).toEqual([1]));
    expect(await findRev(account.did)).toBe("3bbbbbbbbbbbb");
  });

  test("repoRev-4: DBに保存できなかったイベントのrevは記録しない", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const transaction = vi
      .spyOn(services.transactionManager, "transaction")
      .mockRejectedValueOnce(new Error("db down"));

    // act
    send(recordEvent(1, account.did, { rev: "3aaaaaaaaaaaa" }));
    await vi.waitFor(() => expect(transaction).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 200));

    // assert
    expect(acks).toEqual([]);
    expect(await findRev(account.did)).toBeNull();
  });

  test("repoRev-5: revを記録できなかったイベントのレコードは保存しない", async () => {
    // arrange
    await connect();
    const account = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const save = vi
      .spyOn(services.repoRevRepository, "save")
      .mockRejectedValueOnce(new Error("db down"));

    // act
    send(recordEvent(1, account.did));
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 200));

    // assert
    expect(acks).toEqual([]);
    expect(await findPosts(account.did)).toEqual([]);
  });
});
