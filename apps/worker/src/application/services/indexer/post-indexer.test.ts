import { actorFactory, recordFactory } from "@repo/common/test";
import { randomCid } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { PostIndexer } from "./post-indexer.js";

describe("PostIndexer", () => {
  const postIndexer = testInjector.injectClass(PostIndexer);

  const postRepo = testInjector.resolve("postRepository");
  const feedItemRepo = testInjector.resolve("feedItemRepository");
  const jobQueue = testInjector.resolve("jobQueue");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("upsert", () => {
    test("投稿レコードを正しく保存する", async () => {
      // arrange
      const author = actorFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const post = postRepo.findByUri(record.uri);
      expect(post).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        actorDid: author.did,
        text: "test post",
      });

      const feedItem = feedItemRepo.findByUri(record.uri);
      expect(feedItem).toMatchObject({
        uri: record.uri,
        type: "post",
        actorDid: author.did,
        subjectUri: null,
      });
    });

    test("embedにレコードが含まれる場合、fetchRecordジョブが追加される", async () => {
      // arrange
      const author = actorFactory();
      const embedCid = await randomCid();
      const embedUri = "at://did:plc:embeduser/app.bsky.feed.post/embedpost";
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey456`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post with embed",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: embedUri,
              cid: embedCid,
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const jobs = jobQueue.findByQueueName("fetchRecord");
      expect(jobs).toMatchObject([
        {
          queueName: "fetchRecord",
          jobName: embedUri,
          data: {
            uri: embedUri,
            depth: 0,
            live: false,
          },
          options: {
            jobId: embedUri,
            priority: 1,
          },
        },
      ]);
    });

    test("embedがない場合、fetchRecordジョブは追加されない", async () => {
      // arrange
      const author = actorFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey789`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post without embed",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const jobs = jobQueue.findByQueueName("fetchRecord");
      expect(jobs).toEqual([]);
    });

    test("無効な日付（0000-01-01）の投稿でもエラーなく保存される", async () => {
      // arrange
      const author = actorFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey000`,
        json: {
          $type: "app.bsky.feed.post",
          text: "投稿に無効な日付が含まれている",
          createdAt: "0000-01-01T00:00:00.000Z",
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });

      // assert
      const post = postRepo.findByUri(record.uri);
      expect(post?.createdAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));

      const feedItem = feedItemRepo.findByUri(record.uri);
      expect(feedItem?.sortAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));
    });
  });

  describe("afterAction", () => {
    test("投稿時にpost_statsとactorの投稿数の集計がスケジュールされる", async () => {
      // arrange
      const author = actorFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey111`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Regular post without reply",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      const actorStatsJobs = jobQueue.findByQueueName("aggregateActorStats");
      expect(actorStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              did: author.did,
              type: "posts",
            },
          }),
        ]),
      );
      const postStatsJobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(postStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              uri: record.uri.toString(),
              type: "all",
            },
          }),
        ]),
      );
    });

    test("リプライの場合、親投稿に対してreply集計ジョブがスケジュールされる", async () => {
      // arrange
      const parentAuthor = actorFactory();
      const parentUri = `at://${parentAuthor.did}/app.bsky.feed.post/parentpost`;
      const parentCid = await randomCid();

      const replier = actorFactory();
      const record = recordFactory({
        uri: `at://${replier.did}/app.bsky.feed.post/replypost`,
        json: {
          $type: "app.bsky.feed.post",
          text: "New reply",
          reply: {
            root: {
              uri: parentUri,
              cid: parentCid,
            },
            parent: {
              uri: parentUri,
              cid: parentCid,
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      const actorStatsJobs = jobQueue.findByQueueName("aggregateActorStats");
      expect(actorStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              did: replier.did,
              type: "posts",
            },
          }),
        ]),
      );
      const postStatsJobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(postStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              uri: parentUri,
              type: "reply",
            },
          }),
        ]),
      );
    });

    test("引用投稿の場合、quote集計ジョブがスケジュールされる", async () => {
      // arrange
      const quotedAuthor = actorFactory();
      const quotedUri = `at://${quotedAuthor.did}/app.bsky.feed.post/quotedpost`;
      const quotedCid = await randomCid();

      const quotingActor = actorFactory();
      const record = recordFactory({
        uri: `at://${quotingActor.did}/app.bsky.feed.post/quotepost`,
        json: {
          $type: "app.bsky.feed.post",
          text: "This is a quote post",
          embed: {
            $type: "app.bsky.embed.record",
            record: {
              uri: quotedUri,
              cid: quotedCid,
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      const postStatsJobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(postStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              uri: quotedUri,
              type: "quote",
            },
          }),
        ]),
      );
    });

    test("親投稿が存在しない場合でも親投稿に対する集計ジョブがスケジュールされる", async () => {
      // arrange
      const replier = actorFactory();
      const nonExistentParentUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/parent";
      const nonExistentParentCid = await randomCid();
      const record = recordFactory({
        uri: `at://${replier.did}/app.bsky.feed.post/replytonothing`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Reply to non-existent post",
          reply: {
            root: {
              uri: nonExistentParentUri,
              cid: nonExistentParentCid,
            },
            parent: {
              uri: nonExistentParentUri,
              cid: nonExistentParentCid,
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({
        ctx,
        record,
        live: false,
        depth: 0,
      });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      const actorStatsJobs = jobQueue.findByQueueName("aggregateActorStats");
      expect(actorStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              did: replier.did,
              type: "posts",
            },
          }),
        ]),
      );
      const postStatsJobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(postStatsJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            data: {
              uri: nonExistentParentUri,
              type: "reply",
            },
          }),
        ]),
      );
    });

    test("投稿の削除時に呼ばれたafterActioの場合、post_statsは更新しないがactor_statsは更新する", async () => {
      // arrange
      const author = actorFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/deletedpost`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Post that will be deleted",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.afterAction({ action: "delete", ctx, record });

      // assert
      const actorStatsJobs = jobQueue.findByQueueName("aggregateActorStats");
      expect(actorStatsJobs).toEqual([
        expect.objectContaining({
          queueName: "aggregateActorStats",
          data: {
            did: author.did,
            type: "posts",
          },
        }),
      ]);

      const postStatsJobs = jobQueue.findByQueueName("aggregatePostStats");
      expect(postStatsJobs).toEqual([]);
    });
  });
});
