import { AtUri } from "@atproto/syntax";
import {
  postEmbedExternalFactory,
  postEmbedImageFactory,
  postEmbedRecordFactory,
  postFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostQuery } from "./post-query.js";

describe("PostQuery", () => {
  const { ctx } = testSetup;

  const postQuery = new PostQuery(ctx.db);

  describe("findByUris", () => {
    test("存在しない投稿は含めない", async () => {
      // act
      const result = await postQuery.findByUris([
        new AtUri("at://did:plc:123/app.bsky.feed.post/456"),
      ]);

      // assert
      expect(result).toEqual([]);
    });

    test("埋め込みのない投稿は、埋め込みを空にして返す", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      // act
      const result = await postQuery.findByUris([new AtUri(post.uri)]);

      // assert
      expect(result).toEqual([
        {
          uri: post.uri,
          actorDid: post.actorDid,
          embedImages: [],
          embedExternal: null,
          embedRecordUri: null,
          replyRootUri: null,
          indexedAt: post.indexedAt,
        },
      ]);
    });

    test("埋め込みのある投稿は、画像をposition順に並べて埋め込みと一緒に返す", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();
      const image1 = await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({ position: () => 1 })
        .create();
      const image0 = await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({ position: () => 0 })
        .create();
      const external = await postEmbedExternalFactory(ctx.db)
        .vars({ post: () => post })
        .create();
      const record = await postEmbedRecordFactory(ctx.db)
        .vars({ post: () => post })
        .create();

      // act
      const [result] = await postQuery.findByUris([new AtUri(post.uri)]);

      // assert
      expect(result).toMatchObject({
        embedImages: [image0, image1].map((image) => ({
          cid: image.cid,
          alt: image.alt,
          aspectRatio: {
            width: image.aspectRatioWidth,
            height: image.aspectRatioHeight,
          },
        })),
        embedExternal: {
          uri: external.uri,
          title: external.title,
          description: external.description,
          thumbCid: external.thumbCid,
        },
        embedRecordUri: record.uri,
      });
    });
  });
});
