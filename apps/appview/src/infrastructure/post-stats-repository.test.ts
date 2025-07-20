import { getTestSetup, postStatsFactory } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostStatsRepository } from "./post-stats-repository.js";

describe("PostStatsRepository", () => {
  const { testInjector, ctx } = getTestSetup();

  const postStatsRepository = testInjector.injectClass(PostStatsRepository);

  describe("findStats", () => {
    test("空の配列が指定された場合、空のMapを返す", async () => {
      // act
      const result = await postStatsRepository.findMap([]);

      // assert
      expect(result.size).toBe(0);
    });

    test("統計が存在しない投稿が指定された場合、全て0の統計を返す", async () => {
      // arrange
      const postUri = "at://did:plc:123/posts/456";

      // act
      const result = await postStatsRepository.findMap([postUri]);

      // assert
      expect(result.size).toBe(1);
      expect(result.get(postUri)).toEqual({
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    test("統計が存在する投稿が指定された場合、保存された統計を返す", async () => {
      // arrange
      const postStats = await postStatsFactory(ctx.db).create();

      // act
      const result = await postStatsRepository.findMap([postStats.postUri]);

      // assert
      expect(result.get(postStats.postUri)).toEqual({
        likeCount: postStats.likeCount,
        repostCount: postStats.repostCount,
        replyCount: postStats.replyCount,
        quoteCount: postStats.quoteCount,
      });
    });

    test("複数の投稿が指定された場合、それぞれの統計を含むMapを返す", async () => {
      // arrange
      const [postStats1, postStats2] = await postStatsFactory(
        ctx.db,
      ).createList(2);

      // act
      const result = await postStatsRepository.findMap([
        postStats1.postUri,
        postStats2.postUri,
      ]);

      // assert
      expect(result.size).toBe(2);
      expect(result.get(postStats1.postUri)).toEqual({
        likeCount: postStats1.likeCount,
        repostCount: postStats1.repostCount,
        replyCount: postStats1.replyCount,
        quoteCount: postStats1.quoteCount,
      });
      expect(result.get(postStats2.postUri)).toEqual({
        likeCount: postStats2.likeCount,
        repostCount: postStats2.repostCount,
        replyCount: postStats2.replyCount,
        quoteCount: postStats2.quoteCount,
      });
    });
  });
});
