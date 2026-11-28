import { AtUri } from "@atproto/syntax";
import { randomCid } from "@repo/test-utils";
import { assert, beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { Origin } from "../../../domain/origin.js";
import { postFactory } from "../../../domain/post.factory.js";
import { recordFactory } from "../../../domain/record.factory.js";
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
  let registrationQuery: TestServices["registrationQuery"];
  let notificationRepo: TestServices["notificationRepository"];
  let recordRepo: TestServices["recordRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    postIndexer = services.postIndexer;
    postRepo = services.postRepository;
    feedItemRepo = services.feedItemRepository;
    jobScheduler = services.jobScheduler;
    registrationQuery = services.registrationQuery;
    notificationRepo = services.notificationRepository;
    recordRepo = services.recordRepository;
    db = services.db;
  });

  const fetchPostJobs = () =>
    jobScheduler
      .getFetchRecordJobs()
      .filter((job) => job.uri.collection === "app.bsky.feed.post");

  describe("index", () => {
    test("投稿レコードを正しく保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      registrationQuery.add(author.did);
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey123`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      const post = await postRepo.find({ ctx, uri: record.uri });
      expect(post).toMatchObject({
        uri: record.uri,
        cid: record.cid,
        accountDid: author.did,
        text: "test post",
      });

      const feedItem = await feedItemRepo.find({ ctx, uri: record.uri });
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "post",
        accountDid: author.did,
        subjectUri: null,
      });
    });

    test("embedにレコードが含まれる場合、fetchRecordジョブが追加される", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      registrationQuery.add(author.did);
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(fetchPostJobs()).toMatchObject([
        {
          uri: new AtUri(embedUri),
          depth: 0,
          live: true,
        },
      ]);
    });

    test("embedがない場合、fetchRecordジョブは追加されない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey789`,
        json: {
          $type: "app.bsky.feed.post",
          text: "test post without embed",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(fetchPostJobs()).toEqual([]);
    });

    test("無効な日付（0000-01-01）の投稿でもエラーなく保存される", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      registrationQuery.add(author.did);
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey000`,
        json: {
          $type: "app.bsky.feed.post",
          text: "投稿に無効な日付が含まれている",
          createdAt: "0000-01-01T00:00:00.000Z",
        },
      });

      // act
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      const post = await postRepo.find({ ctx, uri: record.uri });
      expect(post?.createdAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));

      const feedItem = await feedItemRepo.find({ ctx, uri: record.uri });
      expect(feedItem?.sortAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));
    });

    const mention = (did: string) => ({
      index: { byteStart: 0, byteEnd: 1 },
      features: [{ $type: "app.bsky.richtext.facet#mention", did }],
    });

    test("notify-7: 引用された投稿の作者に quote の、メンションされたアカウントに mention の通知を作る", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const quoted = accountFactory();
      const mentioned = accountFactory();
      registrationQuery.add(quoted.did);
      registrationQuery.add(mentioned.did);
      const quotedUri = `at://${quoted.did}/app.bsky.feed.post/quoted`;
      const record = recordFactory({
        uri: `at://${accountFactory().did}/app.bsky.feed.post/notify`,
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        { recipientDid: mentioned.did, reason: "mention" },
        { recipientDid: quoted.did, reason: "quote", reasonSubject: quotedUri },
      ]);
    });

    test("notify-8: 1つの投稿から同じ相手への通知は mention、quote、reply の優先順で1件にする", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const mentioned = accountFactory();
      const quoted = accountFactory();
      registrationQuery.add(mentioned.did);
      registrationQuery.add(quoted.did);
      const author = accountFactory();
      const cid = await randomCid();
      const postRecord = ({
        rkey,
        did,
        withMention,
      }: {
        rkey: string;
        did: string;
        withMention: boolean;
      }) => {
        const subject = { uri: `at://${did}/app.bsky.feed.post/subject`, cid };
        return recordFactory({
          uri: AtUri.make(author.did, "app.bsky.feed.post", rkey).toString(),
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
        postRecord({ rkey: "mention", did: mentioned.did, withMention: true }),
        postRecord({ rkey: "quote", did: quoted.did, withMention: false }),
      ]) {
        await postIndexer.index({ ctx, record, origin: Origin.live() });
      }

      // assert
      expect(notificationRepo.findAll()).toMatchObject([
        { recipientDid: mentioned.did, reason: "mention" },
        { recipientDid: quoted.did, reason: "quote" },
      ]);
    });

    test("notify-6: リプライの親投稿から4つ上までの投稿の作者に reply の通知を作る", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const ancestors = [];
      for (let i = 0; i < 5; i++) {
        const account = accountFactory();
        registrationQuery.add(account.did);
        const { post } = postFactory({
          uri: AtUri.make(
            account.did,
            "app.bsky.feed.post",
            `ancestor${i}`,
          ).toString(),
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
        uri: `at://${accountFactory().did}/app.bsky.feed.post/reply`,
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(notificationRepo.findAll()).toMatchObject(
        ancestors.slice(0, 4).map((ancestor) => ({
          recipientDid: ancestor.accountDid,
          reason: "reply",
          reasonSubject: ancestor.uri.toString(),
        })),
      );
    });
  });

  describe("引用禁止の違反", () => {
    const quotedDid = accountFactory().did;
    const quotedUri = `at://${quotedDid}/app.bsky.feed.post/quoted`;

    const disableEmbedding = () =>
      recordRepo.add(
        recordFactory({
          uri: `at://${quotedDid}/app.bsky.feed.postgate/quoted`,
          json: {
            $type: "app.bsky.feed.postgate",
            post: quotedUri,
            embeddingRules: [{ $type: "app.bsky.feed.postgate#disableRule" }],
            createdAt: new Date().toISOString(),
          },
        }),
      );

    const quoteRecord = async (did: string) =>
      recordFactory({
        uri: `at://${did}/app.bsky.feed.post/quote`,
        json: {
          $type: "app.bsky.feed.post",
          text: "quote",
          embed: {
            $type: "app.bsky.embed.record",
            record: { uri: quotedUri, cid: await randomCid() },
          },
          createdAt: new Date().toISOString(),
        },
      });

    test("index-23: 引用を禁止した投稿への作者以外の引用は、引用禁止の違反として保存する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      disableEmbedding();
      registrationQuery.add(quotedDid);
      const records = [
        await quoteRecord(accountFactory().did),
        await quoteRecord(quotedDid),
      ];

      // act
      for (const record of records) {
        await postIndexer.index({ ctx, record, origin: Origin.live() });
      }

      // assert
      const posts = await Promise.all(
        records.map((record) => postRepo.find({ ctx, uri: record.uri })),
      );
      expect(posts.map((post) => post?.violatesEmbeddingRules)).toEqual([
        true,
        false,
      ]);
    });

    test("index-24: 引用禁止の違反は、リアルタイムに受け取った投稿でだけ判定する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      disableEmbedding();
      const author = accountFactory();
      registrationQuery.add(author.did);
      const record = await quoteRecord(author.did);

      // act
      await postIndexer.index({ ctx, record, origin: Origin.backfill() });

      // assert
      const post = await postRepo.find({ ctx, uri: record.uri });
      expect(post?.violatesEmbeddingRules).toBe(false);
    });

    test("notify-10: 引用禁止に違反した引用では quote の通知を作らない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      registrationQuery.add(quotedDid);
      disableEmbedding();
      const record = await quoteRecord(accountFactory().did);

      // act
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(notificationRepo.findAll()).toEqual([]);
    });
  });

  describe("統計の集計", () => {
    test("投稿時にpost_statsとaccountの投稿数の集計がスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      registrationQuery.add(author.did);
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/postkey111`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Regular post without reply",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toContainEqual(
        author.did,
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(record.uri);
    });

    test("リプライの場合、親投稿に対してreply集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const parentAuthor = accountFactory();
      const parentUri = `at://${parentAuthor.did}/app.bsky.feed.post/parentpost`;
      const parentCid = await randomCid();

      const replier = accountFactory();
      registrationQuery.add(replier.did);
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toContainEqual(
        replier.did,
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(parentUri));
    });

    test("引用投稿の場合、quote集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const quotedAuthor = accountFactory();
      const quotedUri = `at://${quotedAuthor.did}/app.bsky.feed.post/quotedpost`;
      const quotedCid = await randomCid();

      const quotingAccount = accountFactory();
      registrationQuery.add(quotingAccount.did);
      const record = recordFactory({
        uri: `at://${quotingAccount.did}/app.bsky.feed.post/quotepost`,
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(quotedUri));
    });

    test("親投稿が存在しない場合でも親投稿に対する集計ジョブがスケジュールされる", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const replier = accountFactory();
      registrationQuery.add(replier.did);
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
      await postIndexer.index({ ctx, record, origin: Origin.live() });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toContainEqual(
        replier.did,
      );
      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toContainEqual(new AtUri(nonExistentParentUri));
    });

    test("投稿が削除された場合、post_statsは更新しないがaccount_statsは更新する", () => {
      const ctx = { db, afterCommit };
      // arrange
      const author = accountFactory();
      const record = recordFactory({
        uri: `at://${author.did}/app.bsky.feed.post/deletedpost`,
        json: {
          $type: "app.bsky.feed.post",
          text: "Post that will be deleted",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      postIndexer.afterDelete({ ctx, record });

      // assert
      expect(jobScheduler.getAggregateAccountStatsDids()).toContainEqual(
        author.did,
      );

      const uris = jobScheduler.getAggregatePostStatsUris();
      expect(uris).toEqual([]);
    });
  });
});
