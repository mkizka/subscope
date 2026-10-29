import { AtUri } from "@atproto/syntax";
import { JobQueue, JobScheduler } from "@repo/common/infrastructure";
import { Queue, Worker } from "bullmq";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

describe("統計の集計", () => {
  let container: StartedTestContainer;
  let redisUrl: string;
  let jobQueue: JobQueue;
  let jobScheduler: JobScheduler;
  let queue: Queue;

  beforeAll(async () => {
    container = await new GenericContainer("redis:7-alpine")
      .withExposedPorts(6379)
      .start();
    redisUrl = `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
    jobQueue = new JobQueue(redisUrl);
    jobScheduler = new JobScheduler(jobQueue);
    queue = new Queue("aggregatePostStats", { connection: { url: redisUrl } });
  });

  afterAll(async () => {
    await queue.close();
    await Promise.all(jobQueue.getQueues().map((q) => q.close()));
    await container.stop();
  });

  const runDelayedJob = async () => {
    await vi.waitFor(async () => expect(await queue.getDelayedCount()).toBe(1));
    await queue.promoteJobs();
  };

  test("aggregate-1: 同じ対象の集計ジョブが実行待ちの間に来たイベントは、そのジョブにまとめる", async () => {
    // arrange
    const uri = AtUri.make("did:plc:aggregate1", "app.bsky.feed.post", "a");

    // act
    await jobScheduler.scheduleAggregatePostStats(uri, "like");
    await jobScheduler.scheduleAggregatePostStats(uri, "like");

    // assert
    expect(await queue.getDelayedCount()).toBe(1);
    await queue.obliterate({ force: true });
  });

  test("aggregate-2: 集計ジョブの実行中や完了後に来たイベントは、もう一度集計する", async () => {
    // arrange
    const uri = AtUri.make("did:plc:aggregate2", "app.bsky.feed.post", "a");
    const { promise: firstJobBlocker, resolve: finishFirstJob } =
      Promise.withResolvers<undefined>();
    let runCount = 0;
    const worker = new Worker(
      "aggregatePostStats",
      async () => {
        runCount++;
        if (runCount === 1) await firstJobBlocker;
      },
      { connection: { url: redisUrl } },
    );

    // act
    await jobScheduler.scheduleAggregatePostStats(uri, "like");
    await runDelayedJob();
    await vi.waitFor(() => expect(runCount).toBe(1));
    await jobScheduler.scheduleAggregatePostStats(uri, "like");
    finishFirstJob(undefined);
    await runDelayedJob();
    await vi.waitFor(() => expect(runCount).toBe(2));
    await jobScheduler.scheduleAggregatePostStats(uri, "like");
    await runDelayedJob();

    // assert
    await vi.waitFor(() => expect(runCount).toBe(3));
    await worker.close();
  });
});
