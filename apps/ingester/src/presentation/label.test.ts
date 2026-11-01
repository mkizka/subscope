import assert from "node:assert";
import { once } from "node:events";

import { MessageFrame } from "@atproto/xrpc-server";
import type { IJobQueue } from "@repo/common/domain";
import { MetricReporter } from "@repo/common/infrastructure";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { InMemoryLabelCursorStore } from "../infrastructure/label-cursor-store.in-memory.js";
import { LabelIngester } from "./label.js";

const label = (val: string) => ({
  src: "did:plc:ar7c4by46qjdydhdevvrndac",
  uri: "did:plc:abc123",
  val,
  cts: "2026-01-01T00:00:00.000Z",
});

describe("LabelIngester", () => {
  let server: WebSocketServer;
  let moderationUrl: string;
  const jobQueue = {
    add: vi.fn(),
    addBatchItems: vi.fn(),
    popBatchItems: vi.fn(),
    getQueues: vi.fn(),
  } satisfies IJobQueue;
  const labelCursorStore = new InMemoryLabelCursorStore();

  const connect = async () => {
    const connection = new Promise<[WebSocket, URL]>((resolve) =>
      server.once("connection", (socket, req) =>
        resolve([socket, new URL(req.url ?? "", moderationUrl)]),
      ),
    );
    const ingester = new LabelIngester(
      new MetricReporter(),
      jobQueue,
      labelCursorStore,
      moderationUrl,
    );
    void ingester.start();
    return connection;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
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

  test("label-1: 受け取ったラベルを1件ずつlabelキューに積む", async () => {
    const [socket] = await connect();
    const labels = [label("!takedown"), { ...label("spam"), neg: true }];
    socket.send(
      new MessageFrame({ seq: 1, labels }, { type: "#labels" }).toBytes(),
    );

    await vi.waitFor(() => expect(jobQueue.add).toHaveBeenCalledTimes(2));
    for (const data of labels) {
      expect(jobQueue.add).toHaveBeenCalledWith({
        queueName: "label",
        jobName: `${data.src}:${data.uri}:${data.val}`,
        data: expect.objectContaining(data),
      });
    }
  });

  test("label-2: 最後に受け取ったラベルのseqをRedisに保存し、再接続時はその続きから受け取る", async () => {
    const [firstSocket, firstUrl] = await connect();
    expect(firstUrl.searchParams.has("cursor")).toBe(false);

    firstSocket.send(
      new MessageFrame(
        { seq: 42, labels: [label("!takedown")] },
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
