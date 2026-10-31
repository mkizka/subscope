import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  likeFactory,
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
      const viewer = await actorFactory(ctx.db).create();
      const [viewerLike, otherLike] = await Promise.all([
        likeFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.like")
                .vars({ actor: () => viewer })
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
});
