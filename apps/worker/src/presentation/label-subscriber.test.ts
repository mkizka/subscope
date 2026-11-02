import assert from "node:assert";
import { once } from "node:events";

import { MessageFrame } from "@atproto/xrpc-server";
import {
  MetricReporter,
  TransactionManager,
} from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";
import { InMemoryLabelCursorStore } from "../infrastructure/label-cursor-store/label-cursor-store.in-memory.js";
import { ActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.js";
import { LabelRepository } from "../infrastructure/repositories/label-repository/label-repository.js";
import { LabelSubscriber } from "./label-subscriber.js";

const label = (uri: string, val: string) => ({
  src: "did:plc:ar7c4by46qjdydhdevvrndac",
  uri,
  val,
  cts: "2026-01-01T00:00:00.000Z",
});

describe("モデレーションサービスからのラベル受信", () => {
  const { ctx } = testSetup;
  let server: WebSocketServer;
  let moderationUrl: string;
  const labelCursorStore = new InMemoryLabelCursorStore();

  const connect = async () => {
    const connection = new Promise<[WebSocket, URL]>((resolve) =>
      server.once("connection", (socket, req) =>
        resolve([socket, new URL(req.url ?? "", moderationUrl)]),
      ),
    );
    const subscriber = new LabelSubscriber(
      new MetricReporter(),
      new IndexLabelUseCase(
        new LabelRepository(),
        new ActorRepository(),
        new TransactionManager(ctx.db),
      ),
      labelCursorStore,
      moderationUrl,
    );
    void subscriber.start();
    return connection;
  };

  beforeEach(async () => {
    labelCursorStore.clear();
    server = new WebSocketServer({ port: 0 });
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    moderationUrl = `ws://localhost:${address.port}`;
  });

  afterEach(async () => {
    for (const client of server.clients) {
      client.close(1000);
    }
    await new Promise((resolve) => server.close(resolve));
  });

  test("subscribeLabels-1: 受け取ったラベルを1件ずつ保存する", async () => {
    const actor = await actorFactory(ctx.db).create();
    const [socket] = await connect();
    const labels = [label(actor.did, "!takedown"), label(actor.did, "spam")];
    socket.send(
      new MessageFrame({ seq: 1, labels }, { type: "#labels" }).toBytes(),
    );

    await vi.waitFor(async () => {
      const saved = await ctx.db.select().from(schema.labels);
      expect(saved).toEqual([
        expect.objectContaining({ uri: actor.did, val: "!takedown" }),
        expect.objectContaining({ uri: actor.did, val: "spam" }),
      ]);
    });
  });

  test("subscribeLabels-2: 最後に受け取ったラベルのseqをRedisに保存し、再接続時はその続きから受け取る", async () => {
    const [firstSocket, firstUrl] = await connect();
    expect(firstUrl.searchParams.has("cursor")).toBe(false);

    firstSocket.send(
      new MessageFrame(
        { seq: 42, labels: [label("did:plc:abc123", "!takedown")] },
        { type: "#labels" },
      ).toBytes(),
    );
    await vi.waitFor(async () =>
      expect(await labelCursorStore.getCursor(moderationUrl)).toBe(42),
    );

    const [, secondUrl] = await connect();
    expect(secondUrl.searchParams.get("cursor")).toBe("42");
  });
});
