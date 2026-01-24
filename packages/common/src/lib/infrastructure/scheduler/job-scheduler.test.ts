import { AtUri } from "@atproto/syntax";
import { beforeEach, describe, expect, test } from "vitest";

import { InMemoryJobQueue } from "../job-queue/job-queue.in-memory.js";
import { JobScheduler } from "./job-scheduler.js";

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
});
