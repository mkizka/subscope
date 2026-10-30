import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  labelFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("テイクダウン", () => {
  const { ctx } = testSetup;

  const createPost = () =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({
              actor: () =>
                actorFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .create(),
      })
      .create();

  const fetchPostUris = async (uris: string[]) => {
    const { client } = await setupApiTest();
    const res = await client.call(getPosts, {
      uris: uris.map((uri) => asAtUriString(uri)),
    });
    return res.posts.map((post) => post.uri);
  };

  test.each(["!takedown", "!suspend"])(
    "takedown-1: `!takedown` か `!suspend` のラベルが付いたアカウントと、その投稿は応答に含めない(%s)",
    async (val) => {
      // arrange
      const post = await createPost();
      const visible = await createPost();
      await labelFactory(ctx.db)
        .props({
          uri: () => post.actorDid,
          actorDid: () => post.actorDid,
          val: () => val,
        })
        .create();

      // act
      const uris = await fetchPostUris([post.uri, visible.uri]);

      // assert
      expect(uris).toEqual([visible.uri]);
    },
  );

  test("takedown-2: `!takedown` のラベルが付いた投稿は応答に含めない", async () => {
    // arrange
    const post = await createPost();
    const visible = await createPost();
    await labelFactory(ctx.db)
      .props({ uri: () => post.uri, actorDid: () => post.actorDid })
      .create();

    // act
    const uris = await fetchPostUris([post.uri, visible.uri]);

    // assert
    expect(uris).toEqual([visible.uri]);
  });

  test("takedown-3: 期限が切れたラベルは無視する", async () => {
    // arrange
    const post = await createPost();
    await labelFactory(ctx.db)
      .props({
        uri: () => post.uri,
        actorDid: () => post.actorDid,
        exp: () => new Date(Date.now() - 1000),
      })
      .create();

    // act
    const uris = await fetchPostUris([post.uri]);

    // assert
    expect(uris).toEqual([post.uri]);
  });
});
