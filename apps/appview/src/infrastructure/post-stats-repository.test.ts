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
  describe("findStats", () => {
    it("空の配列が指定された場合、空のMapを返す", async () => {
      // arrange

      // act
      const result = await postStatsRepository.findStats([]);

      // assert
      expect(result.size).toBe(0);
    });

    it("統計が存在しない投稿が指定された場合、全て0の統計を返す", async () => {
      // arrange
      const postUri = AtUri.make(
        "did:plc:test",
        "app.bsky.feed.post",
        "test",
      ).toString();

      // act
      const result = await postStatsRepository.findStats([postUri]);

      // assert
      expect(result.size).toBe(1);
      expect(result.get(postUri)).toEqual({
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it("統計が存在する投稿が指定された場合、保存された統計を返す", async () => {
      // arrange
      const actorDid = "did:plc:stats";
      const postUri = AtUri.make(
        actorDid,
        "app.bsky.feed.post",
        "post",
      ).toString();

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "stats.test",
      });

      await ctx.db.insert(schema.records).values({
        uri: postUri,
        cid: "bafyreipost",
        actorDid,
        json: {},
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "bafyreipost",
        actorDid,
        text: "Test post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      await ctx.db.insert(schema.postStats).values({
        postUri,
        likeCount: 2,
        repostCount: 1,
        replyCount: 3,
      });

      // act
      const result = await postStatsRepository.findStats([postUri]);

      // assert
      expect(result.get(postUri)).toEqual({
        likeCount: 2,
        repostCount: 1,
        replyCount: 3,
        quoteCount: 0,
      });
    });

    it("複数の投稿が指定された場合、それぞれの統計を含むMapを返す", async () => {
      // arrange
      const actorDid = "did:plc:multi";
      const post1Uri = AtUri.make(
        actorDid,
        "app.bsky.feed.post",
        "post1",
      ).toString();
      const post2Uri = AtUri.make(
        actorDid,
        "app.bsky.feed.post",
        "post2",
      ).toString();

      await ctx.db.insert(schema.actors).values({
        did: actorDid,
        handle: "multi.test",
      });

      await ctx.db.insert(schema.records).values([
        {
          uri: post1Uri,
          cid: "bafyreipost1",
          actorDid,
          json: {},
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: post2Uri,
          cid: "bafyreipost2",
          actorDid,
          json: {},
          indexedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.posts).values([
        {
          uri: post1Uri,
          cid: "bafyreipost1",
          actorDid,
          text: "Post 1",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          uri: post2Uri,
          cid: "bafyreipost2",
          actorDid,
          text: "Post 2",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ]);

      await ctx.db.insert(schema.postStats).values([
        {
          postUri: post1Uri,
          likeCount: 2,
          repostCount: 0,
          replyCount: 0,
        },
        {
          postUri: post2Uri,
          likeCount: 0,
          repostCount: 1,
          replyCount: 0,
        },
      ]);

      // act
      const result = await postStatsRepository.findStats([post1Uri, post2Uri]);

      // assert
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
  });
});
