import { AtUri } from "@atproto/syntax";
import { postStatsFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostStatsQuery } from "./post-stats-query.js";

describe("PostStatsQuery", () => {
  const { ctx } = testSetup;

  const postStatsQuery = new PostStatsQuery(ctx.db);

  describe("findStats", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await postStatsQuery.findStats([]);

      // assert
      expect(result).toEqual([]);
    });

    test("統計が存在しない投稿は含めない", async () => {
      // act
      const result = await postStatsQuery.findStats([
        new AtUri("at://did:plc:123/app.bsky.feed.post/456"),
      ]);

      // assert
      expect(result).toEqual([]);
    });

    test("複数の投稿が指定された場合、それぞれの統計をURI付きで返す", async () => {
      // arrange
      const [postStats1, postStats2] = await postStatsFactory(
        ctx.db,
      ).createList(2);

      // act
      const result = await postStatsQuery.findStats([
        new AtUri(postStats1.postUri),
        new AtUri(postStats2.postUri),
      ]);

      // assert
      expect(result).toEqual(
        expect.arrayContaining(
          [postStats1, postStats2].map((stats) => ({
            uri: stats.postUri,
            likeCount: stats.likeCount,
            repostCount: stats.repostCount,
            replyCount: stats.replyCount,
            quoteCount: stats.quoteCount,
          })),
        ),
      );
      expect(result).toHaveLength(2);
    });
  });
});
