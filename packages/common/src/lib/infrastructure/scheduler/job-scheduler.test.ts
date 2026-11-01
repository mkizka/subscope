import { AtUri } from "@atproto/syntax";
import { beforeEach, describe, expect, test } from "vitest";

import { InMemoryJobQueue } from "../job-queue/job-queue.in-memory.js";
import { JobScheduler } from "./job-scheduler.js";

const AGGREGATE_STATS_DELAY_MS = 10 * 1000;

describe("JobScheduler", () => {
  const jobQueue = new InMemoryJobQueue();
  const jobScheduler = new JobScheduler(jobQueue);

  beforeEach(() => {
    jobQueue.clear();
  });

  test("index-12: バックフィル(liveがfalse)のレコードから積むレコードの取得とハンドルの解決のジョブは、ライブのものより低い優先度で積む", async () => {
    // act
    for (const live of [false, true]) {
      const did = `did:plc:${live}` as const;
      await jobScheduler.scheduleFetchRecord(
        AtUri.make(did, "app.bsky.actor.profile", "self"),
        { live, depth: 0 },
      );
      await jobScheduler.scheduleResolveDid(did, { live });
    }

    // assert
    expect(jobQueue.getJobs().map((job) => job.options?.priority)).toEqual([
      1,
      1,
      undefined,
      undefined,
    ]);
  });

  describe("scheduleFetchRecord", () => {
    test("fetchRecordジョブをスケジュールする", async () => {
      // arrange
      const uri = AtUri.make("did:plc:test", "app.bsky.actor.profile", "self");

      // act
      await jobScheduler.scheduleFetchRecord(uri, { live: false, depth: 0 });

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "fetchRecord",
        jobName: uri.toString(),
        data: {
          uri: uri.toString(),
          depth: 0,
          live: false,
        },
        options: {
          jobId: uri.toString(),
          priority: 1,
        },
      });
    });
  });

  describe("scheduleResolveDid", () => {
    test("resolveDidジョブをスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleResolveDid(did, { live: true });

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "resolveDid",
        jobName: `at://${did}`,
        data: did,
        options: {
          jobId: `at://${did}`,
        },
      });
    });
  });

  describe("scheduleSyncTapRepo", () => {
    test("syncTapRepoジョブを遅延なしでスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleSyncTapRepo(did);

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "syncTapRepo",
        jobName: did,
        data: did,
      });
      expect(jobs[0]?.options?.delay).toBeUndefined();
    });
  });

  describe("scheduleAggregatePostStats", () => {
    test("投稿のURIを集計待ちに追加してaggregatePostStatsジョブをスケジュールする", async () => {
      // arrange
      const uri = AtUri.make("did:plc:test", "app.bsky.feed.post", "test-rkey");

      // act
      await jobScheduler.scheduleAggregatePostStats(uri);

      // assert
      expect(jobQueue.getBatchItems("aggregatePostStats")).toEqual([
        uri.toString(),
      ]);
      expect(jobQueue.getJobs()).toMatchObject([
        {
          queueName: "aggregatePostStats",
          options: { delay: AGGREGATE_STATS_DELAY_MS },
        },
      ]);
    });
  });

  describe("scheduleAggregateActorStats", () => {
    test("aggregateActorStatsジョブをスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleAggregateActorStats(did, "posts");

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "aggregateActorStats",
        jobName: did,
        data: {
          did,
          type: "posts",
        },
        options: {
          deduplication: { id: `posts__${did}`, keepLastIfActive: true },
          delay: AGGREGATE_STATS_DELAY_MS,
        },
      });
    });
  });
});
