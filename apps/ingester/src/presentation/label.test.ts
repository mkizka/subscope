import assert from "node:assert";
import { once } from "node:events";

import { MessageFrame } from "@atproto/xrpc-server";
import type { IJobQueue } from "@repo/common/domain";
import { MetricReporter } from "@repo/common/infrastructure";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { LabelIngester } from "./label.js";

const label = (val: string) => ({
  src: "did:plc:ar7c4by46qjdydhdevvrndac",
  uri: "did:plc:abc123",
  val,
  cts: "2026-01-01T00:00:00.000Z",
});

describe("LabelIngester", () => {
  let server: WebSocketServer;
  let socket: WebSocket;
  const jobQueue = { add: vi.fn(), getQueues: vi.fn() } satisfies IJobQueue;

  beforeEach(async () => {
    server = new WebSocketServer({ port: 0 });
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    const connection = new Promise<WebSocket>((resolve) =>
      server.once("connection", resolve),
    );
    const ingester = new LabelIngester(
      new MetricReporter(),
      jobQueue,
      `ws://localhost:${address.port}`,
    );
    void ingester.start();
    socket = await connection;
  });

  afterEach(async () => {
    socket.close(1000);
    await new Promise((resolve) => server.close(resolve));
  });

  test("label-1: 受け取ったラベルを1件ずつlabelキューに積む", async () => {
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
});
