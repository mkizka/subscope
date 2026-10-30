import { asAtIdentifierString, asAtUriString } from "@atproto/syntax";
import getProfiles from "@repo/client/lex/app/bsky/actor/getProfiles";
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

  const createActor = () =>
    actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createPost = () =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: createActor })
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

  const fetchProfileDids = async (dids: string[]) => {
    const { client } = await setupApiTest();
    const res = await client.call(getProfiles, {
      actors: dids.map((did) => asAtIdentifierString(did)),
    });
    return res.profiles.map((profile) => profile.did);
  };

  test.each(["!takedown", "!suspend"])(
    "takedown-1: `!takedown` か `!suspend` のラベルが付いたアカウントと投稿は応答に含めない(%s)",
    async (val) => {
      // arrange
      const actor = await createActor();
      const visibleActor = await createActor();
      const post = await createPost();
      const visiblePost = await createPost();
      await labelFactory(ctx.db)
        .vars({ actor: () => actor })
        .props({ val: () => val })
        .create();
      await labelFactory(ctx.db)
        .props({
          uri: () => post.uri,
          actorDid: () => post.actorDid,
          val: () => val,
        })
        .create();

      // act
      const dids = await fetchProfileDids([actor.did, visibleActor.did]);
      const uris = await fetchPostUris([post.uri, visiblePost.uri]);

      // assert
      expect(dids).toEqual([visibleActor.did]);
      expect(uris).toEqual([visiblePost.uri]);
    },
  );

  test("takedown-2: テイクダウンされたアカウントの投稿は応答に含めない", async () => {
    // arrange
    const post = await createPost();
    const visiblePost = await createPost();
    await labelFactory(ctx.db)
      .props({ uri: () => post.actorDid, actorDid: () => post.actorDid })
      .create();

    // act
    const uris = await fetchPostUris([post.uri, visiblePost.uri]);

    // assert
    expect(uris).toEqual([visiblePost.uri]);
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
