import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  fakeCid,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";

describe("RepostIndexer", () => {
  let repostIndexer: TestServices["repostIndexer"];
  let repostRepo: TestServices["repostRepository"];
  let feedItemRepo: TestServices["feedItemRepository"];
  let postRepo: TestServices["postRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let notificationRepo: TestServices["notificationRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    repostIndexer = services.repostIndexer;
    repostRepo = services.repostRepository;
    feedItemRepo = services.feedItemRepository;
    postRepo = services.postRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("リポストレコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const reposter = actorFactory();
      const author = actorFactory();
      const subjectUri = `at://${author.did}/app.bsky.feed.post/123`;

      const record = recordFactory({
        uri: `at://${reposter.did}/app.bsky.feed.repost/repostrkey123`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: subjectUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await repostIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const repost = repostRepo.findByUri(record.uri);
      expect(repost).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: reposter.did,
        subjectUri: new AtUri(subjectUri),
      });

      const feedItem = feedItemRepo.findByUri(record.uri);
      expect(feedItem).toMatchObject({
        uri: record.uri,
        type: "repost",
        actorDid: reposter.did,
        subjectUri: subjectUri,
      });

      expect(jobScheduler.getFetchRecordJobs()).toMatchObject([
        {
          uri: new AtUri(subjectUri),
          depth: 0,
          live: false,
        },
      ]);
    });

    test("notify-4: リポストされた投稿の作者に repost の通知を作る", async () => {
      // arrange
      const reposter = actorFactory();
      const author = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: author.did }));
      const subjectUri = `at://${author.did}/app.bsky.feed.post/123`;
      const record = recordFactory({
        uri: `at://${reposter.did}/app.bsky.feed.repost/repostrkey`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: { uri: subjectUri, cid: fakeCid() },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await repostIndexer.upsert({
        ctx: { db, afterCommit },
        record,
        live: false,
        depth: 0,
      });

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        {
          recordUri: record.uri.toString(),
          recipientDid: author.did,
          authorDid: reposter.did,
          reason: "repost",
          reasonSubject: subjectUri,
        },
      ]);
    });
  });

  describe("afterAction", () => {
    test("リポスト投稿の場合、対象投稿に対してrepost集計ジョブがスケジュールされる", () => {
      // arrange
      const { post } = postFactory();
      postRepo.add(post);

      const record = recordFactory({
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: post.uri.toString(),
            cid: post.cid,
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      repostIndexer.afterAction({ ctx: { db, afterCommit }, record });

      // assert
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(post.uri);
    });
  });
});
