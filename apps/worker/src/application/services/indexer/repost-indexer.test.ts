import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  fakeCid,
  postFactory,
  recordFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("RepostIndexer", () => {
  let sut: TestServices["repostIndexer"];
  let repostRepository: TestServices["repostRepository"];
  let feedItemRepository: TestServices["feedItemRepository"];
  let postRepository: TestServices["postRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.repostIndexer;
    repostRepository = services.repostRepository;
    feedItemRepository = services.feedItemRepository;
    postRepository = services.postRepository;
    jobScheduler = services.jobScheduler;
    db = services.db;
  });

  describe("upsert", () => {
    test("リポストレコードを正しく保存する", async () => {
      const ctx = { db };
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
      await sut.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const repost = repostRepository.findByUri(record.uri);
      expect(repost).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: reposter.did,
        subjectUri: new AtUri(subjectUri),
      });

      const feedItem = feedItemRepository.findByUri(record.uri);
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
  });

  describe("afterAction", () => {
    test("リポスト投稿の場合、対象投稿に対してrepost集計ジョブがスケジュールされる", async () => {
      // arrange
      const { post } = postFactory();
      postRepository.add(post);

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
      await sut.afterAction({ record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: post.uri,
          type: "repost",
        }),
      );
    });
  });
});
