import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  actorFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RepostQuery } from "./repost-query.js";

describe("RepostQuery", () => {
  const { ctx } = testSetup;

  const repostQuery = new RepostQuery(ctx.db);

  describe("findViewerReposts", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await repostQuery.findViewerReposts({
        viewerDid: asDid("did:plc:viewer"),
        subjectUris: [],
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたビューアーのリポストだけを、リポストのURIと対象のURIで返す", async () => {
      // arrange
      const viewer = await actorFactory(ctx.db).create();
      const [viewerRepost, otherRepost] = await Promise.all([
        repostFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.repost")
                .vars({ actor: () => viewer })
                .create(),
          })
          .create(),
        repostFactory(ctx.db).create(),
      ]);

      // act
      const result = await repostQuery.findViewerReposts({
        viewerDid: asDid(viewer.did),
        subjectUris: [viewerRepost, otherRepost].map(
          (repost) => new AtUri(repost.subjectUri),
        ),
      });

      // assert
      expect(result).toEqual([
        { uri: viewerRepost.uri, subjectUri: viewerRepost.subjectUri },
      ]);
    });
  });
});
