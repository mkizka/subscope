import { AtUri } from "@atproto/syntax";
import { actorFactory, fakeCid, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { LikeIndexer } from "./like-indexer.js";

describe("LikeIndexer", () => {
  const likeIndexer = testInjector.injectClass(LikeIndexer);

  const likeRepo = testInjector.resolve("likeRepository");
  const jobScheduler = testInjector.resolve("jobScheduler");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("いいねレコードを正しく保存する", async () => {
      // arrange
      const liker = actorFactory();
      const postUri = "at://did:plc:other/app.bsky.feed.post/123";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await likeIndexer.upsert({
        ctx,
        record,
      });

      // assert
      const like = likeRepo.findByUri(record.uri);
      expect(like).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: liker.did,
        subjectUri: new AtUri(postUri),
      });
    });
  });

  describe("afterAction", () => {
    test("いいね追加の場合、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      // arrange
      const liker = actorFactory();
      const postUri = "at://did:plc:post-author/app.bsky.feed.post/postkey456";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey456`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });
      await likeIndexer.upsert({
        ctx,
        record,
      });

      // act
      await likeIndexer.afterAction({ record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(postUri),
          type: "like",
        }),
      );
    });

    test("いいね削除の場合も、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      // arrange
      const liker = actorFactory();
      const postUri = "at://did:plc:post-author/app.bsky.feed.post/postkey789";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey789`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: postUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await likeIndexer.afterAction({ record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(postUri),
          type: "like",
        }),
      );
    });

    test("対象の投稿が存在しない場合でも集計ジョブがスケジュールされる", async () => {
      // arrange
      const liker = actorFactory();
      const nonExistentPostUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/999";
      const record = recordFactory({
        uri: `at://${liker.did}/app.bsky.feed.like/likerkey999`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: nonExistentPostUri,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await likeIndexer.afterAction({ record });

      // assert
      const jobs = jobScheduler.getAggregatePostStatsJobs();
      expect(jobs).toContainEqual(
        expect.objectContaining({
          uri: new AtUri(nonExistentPostUri),
          type: "like",
        }),
      );
    });
  });
});
