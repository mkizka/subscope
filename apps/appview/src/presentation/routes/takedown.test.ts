import { asAtIdentifierString, asAtUriString } from "@atproto/syntax";
import getProfiles from "@repo/client/lex/app/bsky/actor/getProfiles";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import { schema } from "@repo/db";
import {
  accountFactory,
  labelFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("テイクダウン", () => {
  const { ctx } = testSetup;

  const createAccount = () =>
    accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();

  const createPost = () =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ account: createAccount })
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
      const account = await createAccount();
      const visibleAccount = await createAccount();
      const post = await createPost();
      const visiblePost = await createPost();
      await labelFactory(ctx.db)
        .vars({ account: () => account })
        .props({ val: () => val })
        .create();
      await labelFactory(ctx.db)
        .props({
          uri: () => post.uri,
          accountDid: () => post.accountDid,
          val: () => val,
        })
        .create();

      // act
      const dids = await fetchProfileDids([account.did, visibleAccount.did]);
      const uris = await fetchPostUris([post.uri, visiblePost.uri]);

      // assert
      expect(dids).toEqual([visibleAccount.did]);
      expect(uris).toEqual([visiblePost.uri]);
    },
  );

  test("takedown-2: テイクダウンされたアカウントの投稿は応答に含めない", async () => {
    // arrange
    const post = await createPost();
    const visiblePost = await createPost();
    await labelFactory(ctx.db)
      .props({ uri: () => post.accountDid, accountDid: () => post.accountDid })
      .create();

    // act
    const uris = await fetchPostUris([post.uri, visiblePost.uri]);

    // assert
    expect(uris).toEqual([visiblePost.uri]);
  });

  test.each(["takendown", "suspended", "deactivated"] as const)(
    "takedown-4: 状態が takendown、suspended、deactivated のアカウントとその投稿は応答に含めない(%s)",
    async (status) => {
      // arrange
      const post = await createPost();
      const visiblePost = await createPost();
      await ctx.db
        .update(schema.accounts)
        .set({ status })
        .where(eq(schema.accounts.did, post.accountDid));

      // act
      const dids = await fetchProfileDids([
        post.accountDid,
        visiblePost.accountDid,
      ]);
      const uris = await fetchPostUris([post.uri, visiblePost.uri]);

      // assert
      expect(dids).toEqual([visiblePost.accountDid]);
      expect(uris).toEqual([visiblePost.uri]);
    },
  );

  test("takedown-3: 期限が切れたラベルは無視する", async () => {
    // arrange
    const post = await createPost();
    await labelFactory(ctx.db)
      .props({
        uri: () => post.uri,
        accountDid: () => post.accountDid,
        exp: () => new Date(Date.now() - 1000),
      })
      .create();

    // act
    const uris = await fetchPostUris([post.uri]);

    // assert
    expect(uris).toEqual([post.uri]);
  });
});
