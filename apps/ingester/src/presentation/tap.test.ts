import assert from "node:assert";
import { once } from "node:events";

import type { IJobQueue } from "@repo/common/domain";
import { LoggerManager, MetricReporter } from "@repo/common/infrastructure";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { z } from "zod";

import { HandleCommitUseCase } from "../application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "../application/handle-identity-use-case.js";
import { TapIngester } from "./tap.js";

const did = "did:plc:abc123";
const cid = "bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm";
const post = {
  $type: "app.bsky.feed.post",
  text: "hello",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const recordEvent = (id: number, record: Record<string, unknown>) => ({
  id,
  type: "record",
  record: {
    did,
    rev: "3l3qo2vutsw2b",
    collection: "app.bsky.feed.post",
    rkey: "3l3qo2vuowo2b",
    action: "create",
    record: post,
    cid,
    live: true,
    ...record,
  },
});

describe("TapIngester", () => {
  let server: WebSocketServer;
  let socket: WebSocket;
  let acks: number[];
  const jobQueue = { add: vi.fn(), getQueues: vi.fn() } satisfies IJobQueue;

  const send = async (...events: { id: number }[]) => {
    for (const event of events) socket.send(JSON.stringify(event));
    await vi.waitFor(() => expect(acks).toContain(events.at(-1)?.id));
  };

  beforeEach(async () => {
    acks = [];
    server = new WebSocketServer({ port: 0 });
    await once(server, "listening");
    const address = server.address();
    assert(typeof address === "object" && address);
    const connection = new Promise<WebSocket>((resolve) =>
      server.once("connection", resolve),
    );
    const loggerManager = new LoggerManager("error");
    const metricReporter = new MetricReporter();
    const ingester = new TapIngester(
      loggerManager,
      new HandleCommitUseCase(loggerManager, metricReporter, jobQueue),
      new HandleIdentityUseCase(loggerManager, metricReporter, jobQueue),
      `http://localhost:${address.port}`,
    );
    void ingester.start();
    socket = await connection;
    socket.on("message", (data) => {
      assert(Buffer.isBuffer(data));
      const { id } = z
        .object({ id: z.number() })
        .parse(JSON.parse(data.toString()));
      acks.push(id);
    });
  });

  afterEach(async () => {
    socket.close(1000);
    await new Promise((resolve) => server.close(resolve));
  });

  test("tap-1: サポートするコレクションのcreate・updateイベントは、レコードとCIDとrevを含めてcommitキューに積む", async () => {
    await send(recordEvent(1, {}), recordEvent(2, { action: "update" }));

    for (const operation of ["create", "update"]) {
      expect(jobQueue.add).toHaveBeenCalledWith({
        queueName: "commit",
        jobName: `at://${did}/app.bsky.feed.post/3l3qo2vuowo2b`,
        data: {
          did,
          live: true,
          commit: {
            operation,
            collection: "app.bsky.feed.post",
            rkey: "3l3qo2vuowo2b",
            rev: "3l3qo2vutsw2b",
            record: post,
            cid,
          },
        },
        options: { priority: undefined },
      });
    }
  });

  test("tap-2: deleteイベントは、revを含め、レコードとCIDを含めずにcommitキューに積む", async () => {
    await send(
      recordEvent(1, { action: "delete", record: undefined, cid: undefined }),
    );

    expect(jobQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: "commit",
        data: {
          did,
          live: true,
          commit: {
            operation: "delete",
            collection: "app.bsky.feed.post",
            rkey: "3l3qo2vuowo2b",
            rev: "3l3qo2vutsw2b",
          },
        },
      }),
    );
  });

  test("tap-3: サポートしないコレクションのイベントは積まない", async () => {
    await send(recordEvent(1, { collection: "com.example.unknown" }));

    expect(jobQueue.add).not.toHaveBeenCalled();
  });

  test("tap-4: バックフィル(liveがfalse)のイベントは、ライブのイベントより低い優先度で積む", async () => {
    await send(recordEvent(1, { live: false }));

    expect(jobQueue.add).toHaveBeenCalledWith(
      expect.objectContaining({ options: { priority: 1 } }),
    );
  });

  test("tap-5: identityイベントはidentityキューに積む", async () => {
    const identityEvent = {
      id: 1,
      type: "identity",
      identity: {
        did,
        handle: "alice.test",
        is_active: true,
        status: "active",
      },
    };

    await send(identityEvent);

    expect(jobQueue.add).toHaveBeenCalledWith({
      queueName: "identity",
      jobName: "at://alice.test",
      data: { identity: { did, handle: "alice.test" } },
    });
  });

  test("tap-6: キューに積めなかったイベントはTapにackしない", async () => {
    jobQueue.add.mockRejectedValueOnce(new Error("redis down"));

    await send(recordEvent(1, {}), recordEvent(2, {}));

    expect(acks).toEqual([2]);
  });
});
