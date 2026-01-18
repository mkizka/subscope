import { AtUri } from "@atproto/syntax";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { FetchRecordScheduler } from "./fetch-record-scheduler.js";

describe("FetchRecordScheduler", () => {
  const fetchRecordScheduler = testInjector.injectClass(FetchRecordScheduler);
  const jobQueue = testInjector.resolve("jobQueue");

  test("fetchRecordジョブをスケジュールする", async () => {
    // arrange
    const uri = AtUri.make("did:plc:test", "app.bsky.actor.profile", "self");

    // act
    await fetchRecordScheduler.schedule(uri, { live: false, depth: 0 });

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
    await fetchRecordScheduler.schedule(uri, { live: true, depth: 0 });

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
