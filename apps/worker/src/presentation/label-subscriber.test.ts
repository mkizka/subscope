import assert from "node:assert";
import { once } from "node:events";

import { MessageFrame } from "@atproto/xrpc-server";
import {
  MetricReporter,
  TransactionManager,
} from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { IndexLabelService } from "../application/services/index-label-service.js";
import { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";
import { InMemoryCursorStore } from "../infrastructure/cursor-store/cursor-store.in-memory.js";
import { AccountQuery } from "../infrastructure/queries/account-query/account-query.js";
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
  const cursorStore = new InMemoryCursorStore();

  const connect = async () => {
    const connection = new Promise<[WebSocket, URL]>((resolve) =>
      server.once("connection", (socket, req) =>
        resolve([socket, new URL(req.url ?? "", moderationUrl)]),
      ),
    );
    const subscriber = new LabelSubscriber({
      metricReporter: new MetricReporter(),
      indexLabelUseCase: new IndexLabelUseCase(
        new IndexLabelService(new LabelRepository(), new AccountQuery()),
        new TransactionManager(ctx.db),
      ),
      cursorStore,
      env: { MODERATION_URL: moderationUrl },
    });
    void subscriber.start();
    return connection;
  };

  beforeEach(async () => {
    cursorStore.clear();
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
    const account = await accountFactory(ctx.db).create();
    const [socket] = await connect();
    const labels = [
      label(account.did, "!takedown"),
      label(account.did, "spam"),
    ];
    socket.send(
      new MessageFrame({ seq: 1, labels }, { type: "#labels" }).toBytes(),
    );

    await vi.waitFor(async () => {
      const saved = await ctx.db.select().from(schema.labels);
      expect(saved).toEqual([
        expect.objectContaining({ uri: account.did, val: "!takedown" }),
        expect.objectContaining({ uri: account.did, val: "spam" }),
      ]);
    });
  });

  test("subscribeLabels-2: 最後に受け取ったラベルのseqを保存し、再接続時はその続きから受け取る", async () => {
    const [firstSocket, firstUrl] = await connect();
    expect(firstUrl.searchParams.has("cursor")).toBe(false);

    firstSocket.send(
      new MessageFrame(
        { seq: 42, labels: [label("did:plc:abc123", "!takedown")] },
        { type: "#labels" },
      ).toBytes(),
    );
    await vi.waitFor(async () =>
      expect(await cursorStore.getCursor(moderationUrl)).toBe(42),
    );

    const [, secondUrl] = await connect();
    expect(secondUrl.searchParams.get("cursor")).toBe("42");
  });
});
