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

    test("live=trueの場合、priority指定なしでジョブをスケジュールする", async () => {
      // arrange
      const uri = AtUri.make("did:plc:test", "app.bsky.actor.profile", "self");

      // act
      await jobScheduler.scheduleFetchRecord(uri, { live: true, depth: 0 });

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "fetchRecord",
        jobName: uri.toString(),
        data: {
          uri: uri.toString(),
          depth: 0,
          live: true,
        },
        options: {
          jobId: uri.toString(),
        },
      });
    });
  });

  describe("scheduleResolveDid", () => {
    test("resolveDidジョブをスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleResolveDid(did);

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

  describe("scheduleAddTapRepo", () => {
    test("addTapRepoジョブをスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleAddTapRepo(did);

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "addTapRepo",
        jobName: did,
        data: did,
        options: {
          jobId: did,
        },
      });
    });
  });

  describe("scheduleRemoveTapRepo", () => {
    test("removeTapRepoジョブをスケジュールする", async () => {
      // arrange
      const did = "did:plc:test";

      // act
      await jobScheduler.scheduleRemoveTapRepo(did);

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "removeTapRepo",
        jobName: did,
        data: did,
        options: {
          jobId: did,
        },
      });
    });
  });

  describe("scheduleAggregatePostStats", () => {
    test("aggregatePostStatsジョブをスケジュールする", async () => {
      // arrange
      const uri = AtUri.make("did:plc:test", "app.bsky.feed.post", "test-rkey");

      // act
      await jobScheduler.scheduleAggregatePostStats(uri, "reply");

      // assert
      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        queueName: "aggregatePostStats",
        jobName: uri.toString(),
        data: {
          uri: uri.toString(),
          type: "reply",
        },
        options: {
          jobId: `reply__${uri.toString()}`,
          delay: AGGREGATE_STATS_DELAY_MS,
        },
      });
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
          jobId: `posts__${did}`,
          delay: AGGREGATE_STATS_DELAY_MS,
        },
      });
    });
  });
});
