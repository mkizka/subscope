import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  labelFactory,
  postEmbedRecordFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("ラベル", () => {
  const { ctx } = testSetup;

  const createPost = async () => {
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => actor })
            .create(),
      })
      .create();
    return { actor, post };
  };

  const fetchPost = async (uri: string) => {
    const { client } = await setupApiTest();
    const res = await client.call(getPosts, { uris: [asAtUriString(uri)] });
    return res.posts[0];
  };

  test("labels-1: プロフィールのビューの labels に、そのアカウントのDIDに付いたラベルを含める", async () => {
    // arrange
    const { actor, post } = await createPost();
    const label = await labelFactory(ctx.db)
      .vars({ actor: () => actor })
      .props({ val: () => "spam" })
      .create();

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.author.labels).toEqual([
      {
        src: label.src,
        uri: actor.did,
        val: "spam",
        cts: label.cts.toISOString(),
      },
    ]);
  });

  test("labels-2: 投稿のビューの labels に、その投稿に付いたラベルを含める", async () => {
    // arrange
    const { actor, post } = await createPost();
    const label = await labelFactory(ctx.db)
      .vars({ actor: () => actor })
      .props({ uri: () => post.uri, val: () => "porn" })
      .create();

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.labels).toEqual([
      {
        src: label.src,
        uri: post.uri,
        val: "porn",
        cts: label.cts.toISOString(),
      },
    ]);
  });

  test("labels-6: 引用された投稿のビューの labels に、その投稿に付いたラベルを含める", async () => {
    // arrange
    const { actor, post: quoted } = await createPost();
    const { post } = await createPost();
    await postEmbedRecordFactory(ctx.db)
      .vars({ post: () => post, embeddedPost: () => quoted })
      .create();
    const label = await labelFactory(ctx.db)
      .vars({ actor: () => actor })
      .props({ uri: () => quoted.uri, val: () => "porn" })
      .create();

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.embed).toMatchObject({
      record: {
        labels: [
          {
            src: label.src,
            uri: quoted.uri,
            val: "porn",
            cts: label.cts.toISOString(),
          },
        ],
      },
    });
  });
});
