import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  fakeCid,
  postFactory,
  recordFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { RepostIndexer } from "./repost-indexer.js";

describe("RepostIndexer", () => {
  const repostIndexer = testInjector.injectClass(RepostIndexer);

  const repostRepo = testInjector.resolve("repostRepository");
  const feedItemRepo = testInjector.resolve("feedItemRepository");
  const postRepo = testInjector.resolve("postRepository");
  const jobQueue = testInjector.resolve("jobQueue");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("リポストレコードを正しく保存する", async () => {
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
        indexingCtx: { depth: 0, live: false },
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

      const jobs = jobQueue.findByQueueName("fetchRecord");
      expect(jobs).toMatchObject([
        {
          queueName: "fetchRecord",
          jobName: subjectUri,
          data: {
            uri: subjectUri,
            depth: 0,
            live: false,
          },
          options: {
            jobId: subjectUri,
            priority: 2,
          },
        },
      ]);
    });
  });

  describe("afterAction", () => {
    test("リポスト投稿の場合、対象投稿に対してrepost集計ジョブがスケジュールされる", async () => {
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
      await repostIndexer.afterAction({ record });

      // assert
      const jobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(jobs).toMatchObject([
        {
          queueName: "aggregatePostStats",
          data: {
            uri: post.uri.toString(),
            type: "repost",
          },
        },
      ]);
    });
  });
});
