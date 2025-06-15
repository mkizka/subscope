import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { PostStatsRepository } from "./post-stats-repository.js";

let postStatsRepository: PostStatsRepository;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  postStatsRepository = testSetup.testInjector.injectClass(PostStatsRepository);
  ctx = testSetup.ctx;
});

describe("PostStatsRepository", () => {
  describe("findStatsForPosts", () => {
    it("空の配列が指定された場合、空のMapを返す", async () => {
      // Arrange

      // Act
      const result = await postStatsRepository.findStats([]);

      // Assert
      expect(result.size).toBe(0);
    });

    it("統計が存在しない投稿が指定された場合、全て0の統計を返す", async () => {
      // Arrange
      const postUri = AtUri.make(
        "did:plc:test",
        "app.bsky.feed.post",
        "test",
      ).toString();

      // Act
      const result = await postStatsRepository.findStats([postUri]);

      // Assert
      expect(result.size).toBe(1);
      expect(result.get(postUri)).toEqual({
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it("いいねされた投稿が指定された場合、いいね数を取得する", async () => {
      // Arrange
      const postUri = AtUri.make(
        "did:plc:likes",
        "app.bsky.feed.post",
        "liked",
      ).toString();
      const actorDid1 = "did:plc:liker1";
      const actorDid2 = "did:plc:liker2";
      const like1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.like",
        "like1",
      ).toString();
      const like2Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.like",
        "like2",
      ).toString();

      await ctx.db.insert(schema.actors).values([
        { did: actorDid1, handle: "liker1.test" },
        { did: actorDid2, handle: "liker2.test" },
      ]);

      await ctx.db.insert(schema.records).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.likes).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid: actorDid1,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid: actorDid2,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      // Act
      const result = await postStatsRepository.findStats([postUri]);

      // Assert
      expect(result.get(postUri)).toEqual({
        likeCount: 2,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it("リポストされた投稿が指定された場合、リポスト数を取得する", async () => {
      // Arrange
      const postUri = AtUri.make(
        "did:plc:reposts",
        "app.bsky.feed.post",
        "reposted",
      ).toString();
      const actorDid1 = "did:plc:reposter1";
      const actorDid2 = "did:plc:reposter2";
      const actorDid3 = "did:plc:reposter3";
      const repost1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.repost",
        "repost1",
      ).toString();
      const repost2Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.repost",
        "repost2",
      ).toString();
      const repost3Uri = AtUri.make(
        actorDid3,
        "app.bsky.feed.repost",
        "repost3",
      ).toString();

      await ctx.db.insert(schema.actors).values([
        { did: actorDid1, handle: "reposter1.test" },
        { did: actorDid2, handle: "reposter2.test" },
        { did: actorDid3, handle: "reposter3.test" },
      ]);

      await ctx.db.insert(schema.records).values([
        {
          uri: repost1Uri,
          cid: "bafyreirepost1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.repost",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: repost2Uri,
          cid: "bafyreirepost2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.repost",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: repost3Uri,
          cid: "bafyreirepost3",
          actorDid: actorDid3,
          json: {
            $type: "app.bsky.feed.repost",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T02:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T02:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.reposts).values([
        {
          uri: repost1Uri,
          cid: "bafyreirepost1",
          actorDid: actorDid1,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: repost2Uri,
          cid: "bafyreirepost2",
          actorDid: actorDid2,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: repost3Uri,
          cid: "bafyreirepost3",
          actorDid: actorDid3,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T02:00:00.000Z"),
        },
      ]);

      // Act
      const result = await postStatsRepository.findStats([postUri]);

      // Assert
      expect(result.get(postUri)).toEqual({
        likeCount: 0,
        repostCount: 3,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it("返信された投稿が指定された場合、返信数を取得する", async () => {
      // Arrange
      const parentPostUri = AtUri.make(
        "did:plc:replies",
        "app.bsky.feed.post",
        "parent",
      ).toString();
      const actorDid1 = "did:plc:replier1";
      const actorDid2 = "did:plc:replier2";
      const reply1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.post",
        "reply1",
      ).toString();
      const reply2Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.post",
        "reply2",
      ).toString();

      await ctx.db.insert(schema.actors).values([
        { did: actorDid1, handle: "replier1.test" },
        { did: actorDid2, handle: "replier2.test" },
      ]);

      await ctx.db.insert(schema.records).values([
        {
          uri: reply1Uri,
          cid: "bafyreireply1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.post",
            text: "Reply 1",
            reply: {
              parent: { uri: parentPostUri, cid: "bafyreiparent" },
              root: { uri: parentPostUri, cid: "bafyreiparent" },
            },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: reply2Uri,
          cid: "bafyreireply2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.post",
            text: "Reply 2",
            reply: {
              parent: { uri: parentPostUri, cid: "bafyreiparent" },
              root: { uri: parentPostUri, cid: "bafyreiparent" },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.posts).values([
        {
          uri: reply1Uri,
          cid: "bafyreireply1",
          actorDid: actorDid1,
          text: "Reply 1",
          replyParentUri: parentPostUri,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: reply2Uri,
          cid: "bafyreireply2",
          actorDid: actorDid2,
          text: "Reply 2",
          replyParentUri: parentPostUri,
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      // Act
      const result = await postStatsRepository.findStats([parentPostUri]);

      // Assert
      expect(result.get(parentPostUri)).toEqual({
        likeCount: 0,
        repostCount: 0,
        replyCount: 2,
        quoteCount: 0,
      });
    });

    it("複数の投稿が指定された場合、それぞれの統計を同時に取得する", async () => {
      // Arrange
      const post1Uri = AtUri.make(
        "did:plc:multi",
        "app.bsky.feed.post",
        "post1",
      ).toString();
      const post2Uri = AtUri.make(
        "did:plc:multi",
        "app.bsky.feed.post",
        "post2",
      ).toString();
      const actorDid = "did:plc:multiactor";
      const like1Uri = AtUri.make(
        actorDid,
        "app.bsky.feed.like",
        "like1",
      ).toString();
      const like2Uri = AtUri.make(
        actorDid,
        "app.bsky.feed.like",
        "like2",
      ).toString();
      const repost1Uri = AtUri.make(
        actorDid,
        "app.bsky.feed.repost",
        "repost1",
      ).toString();

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "multiactor.test",
      });

      await ctx.db.insert(schema.records).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: post1Uri, cid: "bafyreipost1" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: post1Uri, cid: "bafyreipost1" },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: repost1Uri,
          cid: "bafyreirepost1",
          actorDid,
          json: {
            $type: "app.bsky.feed.repost",
            subject: { uri: post2Uri, cid: "bafyreipost2" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.likes).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid,
          subjectUri: post1Uri,
          subjectCid: "bafyreipost1",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid,
          subjectUri: post1Uri,
          subjectCid: "bafyreipost1",
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.reposts).values({
        uri: repost1Uri,
        cid: "bafyreirepost1",
        actorDid,
        subjectUri: post2Uri,
        subjectCid: "bafyreipost2",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await postStatsRepository.findStats([post1Uri, post2Uri]);

      // Assert
      expect(result.size).toBe(2);
      expect(result.get(post1Uri)).toEqual({
        likeCount: 2,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
      expect(result.get(post2Uri)).toEqual({
        likeCount: 0,
        repostCount: 1,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it("全ての統計が存在する投稿が指定された場合、各統計の値を返す", async () => {
      // Arrange
      const postUri = AtUri.make(
        "did:plc:complete",
        "app.bsky.feed.post",
        "complete",
      ).toString();
      const actorDid1 = "did:plc:actor1";
      const actorDid2 = "did:plc:actor2";
      const like1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.like",
        "like1",
      ).toString();
      const like2Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.like",
        "like2",
      ).toString();
      const repost1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.repost",
        "repost1",
      ).toString();
      const reply1Uri = AtUri.make(
        actorDid1,
        "app.bsky.feed.post",
        "reply1",
      ).toString();
      const reply2Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.post",
        "reply2",
      ).toString();
      const reply3Uri = AtUri.make(
        actorDid2,
        "app.bsky.feed.post",
        "reply3",
      ).toString();

      await ctx.db.insert(schema.actors).values([
        { did: actorDid1, handle: "actor1.test" },
        { did: actorDid2, handle: "actor2.test" },
      ]);

      await ctx.db.insert(schema.records).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.like",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: repost1Uri,
          cid: "bafyreirepost1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.repost",
            subject: { uri: postUri, cid: "bafyreipost" },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: reply1Uri,
          cid: "bafyreireply1",
          actorDid: actorDid1,
          json: {
            $type: "app.bsky.feed.post",
            text: "Reply 1",
            reply: {
              parent: { uri: postUri, cid: "bafyreipost" },
              root: { uri: postUri, cid: "bafyreipost" },
            },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: reply2Uri,
          cid: "bafyreireply2",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.post",
            text: "Reply 2",
            reply: {
              parent: { uri: postUri, cid: "bafyreipost" },
              root: { uri: postUri, cid: "bafyreipost" },
            },
            createdAt: "2024-01-01T01:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: reply3Uri,
          cid: "bafyreireply3",
          actorDid: actorDid2,
          json: {
            $type: "app.bsky.feed.post",
            text: "Reply 3",
            reply: {
              parent: { uri: postUri, cid: "bafyreipost" },
              root: { uri: postUri, cid: "bafyreipost" },
            },
            createdAt: "2024-01-01T02:00:00.000Z",
          },
          indexedAt: new Date("2024-01-01T02:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.likes).values([
        {
          uri: like1Uri,
          cid: "bafyreilike1",
          actorDid: actorDid1,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: like2Uri,
          cid: "bafyreilike2",
          actorDid: actorDid2,
          subjectUri: postUri,
          subjectCid: "bafyreipost",
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.reposts).values({
        uri: repost1Uri,
        cid: "bafyreirepost1",
        actorDid: actorDid1,
        subjectUri: postUri,
        subjectCid: "bafyreipost",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values([
        {
          uri: reply1Uri,
          cid: "bafyreireply1",
          actorDid: actorDid1,
          text: "Reply 1",
          replyParentUri: postUri,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: reply2Uri,
          cid: "bafyreireply2",
          actorDid: actorDid2,
          text: "Reply 2",
          replyParentUri: postUri,
          createdAt: new Date("2024-01-01T01:00:00.000Z"),
        },
        {
          uri: reply3Uri,
          cid: "bafyreireply3",
          actorDid: actorDid2,
          text: "Reply 3",
          replyParentUri: postUri,
          createdAt: new Date("2024-01-01T02:00:00.000Z"),
        },
      ]);

      // Act
      const result = await postStatsRepository.findStats([postUri]);

      // Assert
      expect(result.get(postUri)).toEqual({
        likeCount: 2,
        repostCount: 1,
        replyCount: 3,
        quoteCount: 0,
      });
    });
  });
});
