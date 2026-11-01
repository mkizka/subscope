import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { randomCid } from "@repo/test-utils";
import { assert, beforeEach, describe, expect, test } from "vitest";

import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../../shared/test-utils.js";

describe("PostIndexer", () => {
  let postIndexer: TestServices["postIndexer"];
  let postRepo: TestServices["postRepository"];
  let feedItemRepo: TestServices["feedItemRepository"];
  let jobScheduler: TestServices["jobScheduler"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let notificationRepo: TestServices["notificationRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    postIndexer = services.postIndexer;
    postRepo = services.postRepository;
    feedItemRepo = services.feedItemRepository;
    jobScheduler = services.jobScheduler;
    subscriptionRepo = services.subscriptionRepository;
    notificationRepo = services.notificationRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("投稿レコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
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
      const ctx = { db, afterCommit };
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
      expect(jobScheduler.getFetchRecordJobs()).toMatchObject([
        {
          uri: new AtUri(embedUri),
          depth: 0,
          live: false,
        },
      ]);
    });

    test("embedがない場合、fetchRecordジョブは追加されない", async () => {
      const ctx = { db, afterCommit };
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
      expect(jobScheduler.getFetchRecordJobs()).toEqual([]);
    });

    test("無効な日付（0000-01-01）の投稿でもエラーなく保存される", async () => {
      const ctx = { db, afterCommit };
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

    const mention = (did: string) => ({
      index: { byteStart: 0, byteEnd: 1 },
      features: [{ $type: "app.bsky.richtext.facet#mention", did }],
    });

    test("notify-7: 引用された投稿の作者に quote の、メンションされたアカウントに mention の通知を作る", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const quoted = actorFactory();
      const mentioned = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: quoted.did }));
      subscriptionRepo.add(subscriptionFactory({ actorDid: mentioned.did }));
      const quotedUri = `at://${quoted.did}/app.bsky.feed.post/quoted`;
      const record = recordFactory({
        uri: `at://${actorFactory().did}/app.bsky.feed.post/notify`,
        json: {
          $type: "app.bsky.feed.post",
          text: "@",
          embed: {
            $type: "app.bsky.embed.record",
            record: { uri: quotedUri, cid: await randomCid() },
          },
          facets: [mention(mentioned.did)],
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({ ctx, record, live: false, depth: 0 });

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        { recipientDid: mentioned.did, reason: "mention" },
        { recipientDid: quoted.did, reason: "quote", reasonSubject: quotedUri },
      ]);
    });

    test("notify-8: 1つの投稿から同じ相手への通知は mention > quote > reply の優先順で1件にする", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const mentioned = actorFactory();
      const quoted = actorFactory();
      subscriptionRepo.add(subscriptionFactory({ actorDid: mentioned.did }));
      subscriptionRepo.add(subscriptionFactory({ actorDid: quoted.did }));
      const author = actorFactory();
      const cid = await randomCid();
      const postRecord = (rkey: string, did: string, withMention: boolean) => {
        const subject = { uri: `at://${did}/app.bsky.feed.post/subject`, cid };
        return recordFactory({
          uri: `at://${author.did}/app.bsky.feed.post/${rkey}`,
          json: {
            $type: "app.bsky.feed.post",
            text: "@",
            reply: { root: subject, parent: subject },
            embed: { $type: "app.bsky.embed.record", record: subject },
            facets: withMention ? [mention(did)] : [],
            createdAt: new Date().toISOString(),
          },
        });
      };

      // act
      for (const record of [
        postRecord("mention", mentioned.did, true),
        postRecord("quote", quoted.did, false),
      ]) {
        await postIndexer.upsert({ ctx, record, live: false, depth: 0 });
      }

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        { recipientDid: mentioned.did, reason: "mention" },
        { recipientDid: quoted.did, reason: "quote" },
      ]);
    });

    test("notify-6: リプライの親投稿を含めて4つ上までの投稿の作者に reply の通知を作る", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const ancestors = [];
      for (let i = 0; i < 5; i++) {
        const actor = actorFactory();
        subscriptionRepo.add(subscriptionFactory({ actorDid: actor.did }));
        const { post } = postFactory({
          actorDid: actor.did,
          uri: `at://${actor.did}/app.bsky.feed.post/ancestor${i}`,
          replyParent: ancestors[0] && {
            uri: ancestors[0].uri,
            cid: ancestors[0].cid,
          },
        });
        postRepo.add(post);
        ancestors.unshift(post);
      }
      const [parent] = ancestors;
      assert(parent);
      const record = recordFactory({
        uri: `at://${actorFactory().did}/app.bsky.feed.post/reply`,
        json: {
          $type: "app.bsky.feed.post",
          text: "reply",
          reply: {
            root: { uri: parent.uri.toString(), cid: parent.cid },
            parent: { uri: parent.uri.toString(), cid: parent.cid },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.upsert({ ctx, record, live: false, depth: 0 });

      // assert
      expect(notificationRepo.findAll()).toMatchObject(
        ancestors.slice(0, 4).map((ancestor) => ({
          recipientDid: ancestor.actorDid,
          reason: "reply",
          reasonSubject: ancestor.uri.toString(),
        })),
      );
    });
  });

  describe("afterAction", () => {
    test("投稿時にpost_statsとactorの投稿数の集計がスケジュールされる", async () => {
      const ctx = { db, afterCommit };
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
      const actorStatsJobs = jobScheduler.getAggregateActorStatsJobs();
      expect(actorStatsJobs).toContainEqual(
        expect.objectContaining({
          did: author.did,
          type: "posts",
        }),
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(record.uri);
    });

    test("リプライの場合、親投稿に対してreply集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
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
      const actorStatsJobs = jobScheduler.getAggregateActorStatsJobs();
      expect(actorStatsJobs).toContainEqual(
        expect.objectContaining({
          did: replier.did,
          type: "posts",
        }),
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(parentUri));
    });

    test("引用投稿の場合、quote集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
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
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(quotedUri));
    });

    test("親投稿が存在しない場合でも親投稿に対する集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
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
      const actorStatsJobs = jobScheduler.getAggregateActorStatsJobs();
      expect(actorStatsJobs).toContainEqual(
        expect.objectContaining({
          did: replier.did,
          type: "posts",
        }),
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(nonExistentParentUri));
    });

    test("投稿の削除時に呼ばれたafterActioの場合、post_statsは更新しないがactor_statsは更新する", async () => {
      const ctx = { db, afterCommit };
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
      const actorStatsJobs = jobScheduler.getAggregateActorStatsJobs();
      expect(actorStatsJobs).toContainEqual(
        expect.objectContaining({
          did: author.did,
          type: "posts",
        }),
      );

      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toEqual([]);
    });
  });
});
