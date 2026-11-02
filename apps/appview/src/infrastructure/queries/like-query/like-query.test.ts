import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  accountFactory,
  likeFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { LikeQuery } from "./like-query.js";

describe("LikeQuery", () => {
  const { ctx } = testSetup;

  const likeQuery = new LikeQuery(ctx.db);

  describe("findViewerLikes", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await likeQuery.findViewerLikes({
        viewerDid: asDid("did:plc:viewer"),
        subjectUris: [],
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたビューアーのいいねだけを、いいねのURIと対象のURIで返す", async () => {
      // arrange
      const viewer = await accountFactory(ctx.db).create();
      const [viewerLike, otherLike] = await Promise.all([
        likeFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.like")
                .vars({ account: () => viewer })
                .create(),
          })
          .create(),
        likeFactory(ctx.db).create(),
      ]);

      // act
      const result = await likeQuery.findViewerLikes({
        viewerDid: asDid(viewer.did),
        subjectUris: [viewerLike, otherLike].map(
          (like) => new AtUri(like.subjectUri),
        ),
      });

      // assert
      expect(result).toEqual([
        { uri: viewerLike.uri, subjectUri: viewerLike.subjectUri },
      ]);
    });
  });

  describe("findAccountLikeFeedItems", () => {
    test("指定されたアカウントのいいねだけを、cursorより前からsortAtの降順で投稿のフィードアイテムとして返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const createLike = (createdAt: string) =>
        likeFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.like")
                .vars({ account: () => account })
                .create(),
          })
          .props({ createdAt: () => new Date(createdAt) })
          .create();
      const oldLike = await createLike("2024-01-01T01:00:00.000Z");
      const newLike = await createLike("2024-01-01T02:00:00.000Z");
      await createLike("2024-01-01T03:00:00.000Z");
      await likeFactory(ctx.db).create();

      // act
      const result = await likeQuery.findAccountLikeFeedItems({
        accountDid: asDid(account.did),
        limit: 10,
        cursor: new Date("2024-01-01T02:30:00.000Z"),
      });

      // assert
      expect(result).toEqual([
        {
          uri: newLike.subjectUri,
          type: "post",
          subjectUri: null,
          accountDid: account.did,
          sortAt: newLike.sortAt,
        },
        {
          uri: oldLike.subjectUri,
          type: "post",
          subjectUri: null,
          accountDid: account.did,
          sortAt: oldLike.sortAt,
        },
      ]);
    });
  });

  describe("findSubjectLikes", () => {
    test("指定された投稿へのいいねだけを、cursorより前からsortAtの降順でlimit件まで返す", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();
      const createLike = (createdAt: string) =>
        likeFactory(ctx.db)
          .vars({ subject: () => post })
          .props({ createdAt: () => new Date(createdAt) })
          .create();
      await createLike("2024-01-01T01:00:00.000Z");
      const middleLike = await createLike("2024-01-01T02:00:00.000Z");
      const newLike = await createLike("2024-01-01T03:00:00.000Z");
      await createLike("2024-01-01T04:00:00.000Z");
      await likeFactory(ctx.db).create();

      // act
      const result = await likeQuery.findSubjectLikes({
        subjectUri: post.uri,
        limit: 2,
        cursor: new Date("2024-01-01T03:30:00.000Z"),
      });

      // assert
      expect(result).toEqual([
        {
          accountDid: newLike.accountDid,
          createdAt: newLike.createdAt,
          sortAt: newLike.sortAt,
        },
        {
          accountDid: middleLike.accountDid,
          createdAt: middleLike.createdAt,
          sortAt: middleLike.sortAt,
        },
      ]);
    });
  });
});
