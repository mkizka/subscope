import { AtUri } from "@atproto/syntax";
import { fakeCid, fakeDid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../shared/test-utils.js";
import type { Origin } from "../dto/origin.js";
import { parsePost } from "../dto/post.js";
import { recordFactory } from "../dto/record.factory.js";
import type { Record } from "../dto/record.js";

const postRecord = (uri: `at://${string}`) =>
  recordFactory({
    uri,
    json: {
      $type: "app.bsky.feed.post",
      text: "hello",
      createdAt: new Date().toISOString(),
    },
  });

const quoteRecord = (quotedUri: string, authorDid = fakeDid()) =>
  recordFactory({
    uri: `at://${authorDid}/app.bsky.feed.post/123`,
    json: {
      $type: "app.bsky.feed.post",
      text: "quote",
      embed: {
        $type: "app.bsky.embed.record",
        record: { uri: quotedUri, cid: fakeCid() },
      },
      createdAt: new Date().toISOString(),
    },
  });

describe("レコードの取得の予約", () => {
  let indexRecordService: TestServices["indexRecordService"];
  let jobScheduler: TestServices["jobScheduler"];
  let postRepository: TestServices["postRepository"];
  let registrationQuery: TestServices["registrationQuery"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    indexRecordService = services.indexRecordService;
    jobScheduler = services.jobScheduler;
    postRepository = services.postRepository;
    registrationQuery = services.registrationQuery;
    db = services.db;
  });

  const index = (record: Record, origin: Origin = { type: "tapLive" }) =>
    indexRecordService.index({
      ctx: { db, afterCommit },
      record,
      origin,
      priority: "high",
    });

  const fetchJobsOf = (uri: string) =>
    jobScheduler
      .getFetchRecordJobs()
      .filter((job) => job.uri.toString() === uri);

  test("fetchRecord-8: レコードの作者のプロフィールとハンドルは、保存していなければ取得する", async () => {
    // arrange
    const did = fakeDid();
    const record = postRecord(`at://${did}/app.bsky.feed.post/123`);

    // act
    await index(record);

    // assert
    expect(jobScheduler.getResolveDidJobs()).toMatchObject([{ did }]);
    expect(
      fetchJobsOf(AtUri.make(did, "app.bsky.actor.profile", "self").toString()),
    ).toHaveLength(1);
  });

  test.each<{ origin: Origin; expected: number[] }>([
    { origin: { type: "tapLive" }, expected: [1] },
    { origin: { type: "tapPast" }, expected: [1] },
    { origin: { type: "pds", hop: 1 }, expected: [2] },
    { origin: { type: "pds", hop: 2 }, expected: [] },
  ])(
    "fetchRecord-7: Tapから届いたレコードから辿って取得するのは、2段先までにする($origin.type, $origin.hop)",
    async ({ origin, expected }) => {
      // arrange
      const member = fakeDid();
      registrationQuery.add(member);
      const quotedUri = `at://${fakeDid()}/app.bsky.feed.post/quoted`;
      const record = quoteRecord(quotedUri, member);

      // act
      await index(record, origin);

      // assert
      expect(fetchJobsOf(quotedUri).map((job) => job.hop)).toEqual(expected);
    },
  );

  test.each([
    { name: "未保存", saved: false, expected: 1 },
    { name: "保存済み", saved: true, expected: 0 },
  ])(
    "fetchRecord-5: 引用された投稿とフィードは、保存していなければ取得する($name)",
    async ({ saved, expected }) => {
      // arrange
      const quotedUri = `at://${fakeDid()}/app.bsky.feed.post/quoted` as const;
      if (saved) {
        postRepository.add(parsePost(postRecord(quotedUri)).post);
      }
      const record = quoteRecord(quotedUri);

      // act
      await index(record);

      // assert
      expect(fetchJobsOf(quotedUri)).toHaveLength(expected);
    },
  );

  test.each([
    { name: "未保存", saved: false, expected: 1 },
    { name: "保存済み", saved: true, expected: 0 },
  ])(
    "fetchRecord-6: リポストされた投稿は、保存していなければ取得する($name)",
    async ({ saved, expected }) => {
      // arrange
      const subjectUri =
        `at://${fakeDid()}/app.bsky.feed.post/subject` as const;
      if (saved) {
        postRepository.add(parsePost(postRecord(subjectUri)).post);
      }
      const record = recordFactory({
        uri: `at://${fakeDid()}/app.bsky.feed.repost/123`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: { uri: subjectUri, cid: fakeCid() },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await index(record);

      // assert
      expect(fetchJobsOf(subjectUri)).toHaveLength(expected);
    },
  );
});
