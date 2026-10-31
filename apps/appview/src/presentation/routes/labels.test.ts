import { asAtUriString } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  labelFactory,
  postEmbedRecordFactory,
  postFactory,
  profileFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("ラベル", () => {
  const { ctx } = testSetup;

  type Json = { $type: string; [key: string]: unknown };

  const selfLabels = (val: string) => ({
    $type: "com.atproto.label.defs#selfLabels",
    values: [{ val }],
  });

  const createPost = async ({
    profileJson = { $type: "app.bsky.actor.profile" },
    postJson = { $type: "app.bsky.feed.post" },
  }: { profileJson?: Json; postJson?: Json } = {}) => {
    const actor = await actorFactory(ctx.db).create();
    const profileRecord = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor })
      .props({
        uri: () => `at://${actor.did}/app.bsky.actor.profile/self`,
        json: () => profileJson,
      })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord })
      .create();
    const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({ json: () => postJson })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => postRecord })
      .create();
    return { actor, profileRecord, post, postRecord };
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

  test("labels-3: プロフィールのビューの labels に、プロフィールレコードに付いたラベルを含める", async () => {
    // arrange
    const { actor, profileRecord, post } = await createPost();
    const label = await labelFactory(ctx.db)
      .vars({ actor: () => actor })
      .props({ uri: () => profileRecord.uri, val: () => "porn" })
      .create();

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.author.labels).toEqual([
      {
        src: label.src,
        uri: profileRecord.uri,
        val: "porn",
        cts: label.cts.toISOString(),
      },
    ]);
  });

  test("labels-4: プロフィールのビューの labels に、プロフィールレコードのセルフラベルを含める", async () => {
    // arrange
    const { actor, profileRecord, post } = await createPost({
      profileJson: {
        $type: "app.bsky.actor.profile",
        labels: selfLabels("!no-unauthenticated"),
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.author.labels).toEqual([
      {
        src: actor.did,
        uri: profileRecord.uri,
        cid: profileRecord.cid,
        val: "!no-unauthenticated",
        cts: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  test("labels-5: 投稿のビューの labels に、投稿レコードのセルフラベルを含める", async () => {
    // arrange
    const { actor, post, postRecord } = await createPost({
      postJson: {
        $type: "app.bsky.feed.post",
        text: "",
        labels: selfLabels("nudity"),
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    // act
    const res = await fetchPost(post.uri);

    // assert
    expect(res?.labels).toEqual([
      {
        src: actor.did,
        uri: post.uri,
        cid: postRecord.cid,
        val: "nudity",
        cts: "2026-01-01T00:00:00.000Z",
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
