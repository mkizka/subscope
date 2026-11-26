import { asAtUriString, AtUri } from "@atproto/syntax";
import getPosts from "@repo/client/app/bsky/feed/getPosts";
import {
  accountFactory,
  followFactory,
  likeFactory,
  listFactory,
  listItemFactory,
  postEmbedImageFactory,
  postEmbedRecordFactory,
  postEmbedVideoFactory,
  postFactory,
  profileFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

const pinPost = async (
  db: Parameters<typeof recordFactory>[0],
  {
    account,
    post,
  }: { account: { did: string }; post: { uri: string; cid: string } },
) => {
  const record = await recordFactory(db, "app.bsky.actor.profile")
    .vars({ accountDid: () => account.did })
    .props({
      uri: () => `at://${account.did}/app.bsky.actor.profile/self`,
      json: () => ({
        $type: "app.bsky.actor.profile",
        pinnedPost: { uri: post.uri, cid: post.cid },
      }),
    })
    .create();
  await profileFactory(db)
    .vars({ record: () => record })
    .create();
};

describe("app.bsky.feed.getPosts", () => {
  const { ctx } = testSetup;

  const createPost = (facets?: unknown[]) =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({
              account: () =>
                accountFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .props({
              json: () => ({
                $type: "app.bsky.feed.post",
                text: "post",
                createdAt: new Date().toISOString(),
                facets,
              }),
            })
            .create(),
      })
      .create();

  const createGate = (
    post: { uri: string; accountDid: string },
    allow?: unknown[],
  ) =>
    recordFactory(ctx.db, "app.bsky.feed.threadgate")
      .vars({ accountDid: () => post.accountDid })
      .props({
        uri: () =>
          AtUri.make(
            post.accountDid,
            "app.bsky.feed.threadgate",
            new AtUri(post.uri).rkey,
          ).toString(),
        json: () => ({
          $type: "app.bsky.feed.threadgate",
          post: post.uri,
          createdAt: new Date().toISOString(),
          allow,
        }),
      })
      .create();

  const createPostgate = (
    post: { uri: string; accountDid: string },
    json: object,
  ) =>
    recordFactory(ctx.db, "app.bsky.feed.postgate")
      .vars({ accountDid: () => post.accountDid })
      .props({
        uri: () =>
          AtUri.make(
            post.accountDid,
            "app.bsky.feed.postgate",
            new AtUri(post.uri).rkey,
          ).toString(),
        json: () => ({
          $type: "app.bsky.feed.postgate",
          post: post.uri,
          createdAt: new Date().toISOString(),
          ...json,
        }),
      })
      .create();

  const createReply = (root: { uri: string; cid: string }) =>
    postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({
              account: () =>
                accountFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .create(),
      })
      .use((t) => t.asReplyTo(root))
      .create();

  const follow = (account: { did: string }, followee: { did: string }) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ accountDid: () => account.did })
            .create(),
      })
      .props({ subjectDid: () => followee.did })
      .create();

  test("getPosts-1: 指定したURIの順に投稿を並べる", async () => {
    // arrange
    const { client } = await setupApiTest();
    const first = await createPost();
    const second = await createPost();

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(second.uri), asAtUriString(first.uri)],
    });

    // assert
    expect(res.posts.map((post) => post.uri)).toEqual([second.uri, first.uri]);
  });

  test("getPosts-2: 存在しない投稿は含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await createPost();

    // act
    const res = await client.call(getPosts, {
      uris: [
        "at://did:plc:notfound/app.bsky.feed.post/notfound",
        asAtUriString(post.uri),
      ],
    });

    // assert
    expect(res.posts.map((post) => post.uri)).toEqual([post.uri]);
  });

  test("getPosts-3: 閲覧者がいいね・リポストした投稿は、そのURIをviewer.likeとviewer.repostに含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const post = await createPost();
    const like = await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ account: () => viewer })
            .create(),
        subject: () => post,
      })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ account: () => viewer })
            .create(),
        subject: () => post,
      })
      .create();
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(post.uri)],
    });

    // assert
    expect(res.posts).toMatchObject([
      { viewer: { like: like.uri, repost: repost.uri } },
    ]);
  });

  test("getPosts-4: 閲覧者のプロフィールにピン留めされた投稿は、viewer.pinnedをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const pinned = await createPost();
    const other = await createPost();
    await pinPost(ctx.db, { account: viewer, post: pinned });
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(pinned.uri), asAtUriString(other.uri)],
    });

    // assert
    expect(res.posts.map((post) => post.viewer?.pinned)).toEqual([true, false]);
  });

  test("threadgate-1: 起点の投稿のビューにthreadgateを含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const root = await createPost();
    const reply = await createReply(root);
    const gate = await createGate(root, []);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(root.uri), asAtUriString(reply.uri)],
    });

    // assert
    expect(res.posts[0]?.threadgate).toEqual({
      uri: gate.uri,
      cid: gate.cid,
      record: gate.json,
      lists: [],
    });
    expect(res.posts[1]?.threadgate).toBeUndefined();
  });

  test("threadgate-2: 返信を許されていない閲覧者には、replyDisabledをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const root = await createPost();
    const reply = await createReply(root);
    const list = await listFactory(ctx.db).create();
    await createGate(root, [
      { $type: "app.bsky.feed.threadgate#mentionRule" },
      { $type: "app.bsky.feed.threadgate#followingRule" },
      { $type: "app.bsky.feed.threadgate#followerRule" },
      { $type: "app.bsky.feed.threadgate#listRule", list: list.uri },
    ]);
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(root.uri), asAtUriString(reply.uri)],
    });

    // assert
    expect(res.posts.map((post) => post.viewer?.replyDisabled)).toEqual([
      true,
      true,
    ]);
  });

  test("threadgate-3: 起点の投稿者と、メンション・フォロー・フォロワーの規則に合う閲覧者には、replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const mentioned = await accountFactory(ctx.db).create();
    const followed = await accountFactory(ctx.db).create();
    const follower = await accountFactory(ctx.db).create();
    const root = await createPost([
      {
        index: { byteStart: 0, byteEnd: 4 },
        features: [
          { $type: "app.bsky.richtext.facet#mention", did: mentioned.did },
        ],
      },
    ]);
    const author = { did: root.accountDid };
    await follow(author, followed);
    await follow(follower, author);
    await createGate(root, [
      { $type: "app.bsky.feed.threadgate#mentionRule" },
      { $type: "app.bsky.feed.threadgate#followingRule" },
      { $type: "app.bsky.feed.threadgate#followerRule" },
    ]);

    // act
    const results = [];
    for (const viewer of [author, mentioned, followed, follower]) {
      loginAs(viewer.did);
      const res = await client.call(getPosts, {
        uris: [asAtUriString(root.uri)],
      });
      results.push(res.posts[0]?.viewer?.replyDisabled);
    }

    // assert
    expect(results).toEqual([false, false, false, false]);
  });

  test("threadgate-4: 規則が無いthreadgateでは、replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const root = await createPost();
    await createGate(root);
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(root.uri)],
    });

    // assert
    expect(res.posts[0]?.viewer?.replyDisabled).toBe(false);
  });

  test("threadgate-5: リストの規則のリストに入っている閲覧者には、replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const root = await createPost();
    const [other, list] = await Promise.all([
      listFactory(ctx.db).create(),
      listFactory(ctx.db).create(),
    ]);
    await listItemFactory(ctx.db)
      .vars({ list: () => list, subject: () => viewer })
      .create();
    await createGate(root, [
      { $type: "app.bsky.feed.threadgate#listRule", list: other.uri },
      { $type: "app.bsky.feed.threadgate#listRule", list: list.uri },
    ]);
    loginAs(viewer.did);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(root.uri)],
    });

    // assert
    expect(res.posts[0]?.viewer?.replyDisabled).toBe(false);
  });

  test("threadgate-6: リストの規則のリストのうちインデックスしたものを、threadgateのlistsに含める", async () => {
    // arrange
    const { client } = await setupApiTest();
    const root = await createPost();
    const list = await listFactory(ctx.db).create();
    await createGate(root, [
      { $type: "app.bsky.feed.threadgate#listRule", list: list.uri },
      {
        $type: "app.bsky.feed.threadgate#listRule",
        list: "at://did:plc:unknown/app.bsky.graph.list/unknown",
      },
    ]);

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(root.uri)],
    });

    // assert
    expect(res.posts[0]?.threadgate?.lists).toEqual([
      {
        $type: "app.bsky.graph.defs#listViewBasic",
        uri: list.uri,
        cid: list.cid,
        name: list.name,
        purpose: list.purpose,
        indexedAt: list.indexedAt.toISOString(),
      },
    ]);
  });

  test("postgate-1: 引用を禁止した投稿は、投稿者以外の閲覧者のembeddingDisabledをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    const post = await createPost();
    await createPostgate(post, {
      embeddingRules: [{ $type: "app.bsky.feed.postgate#disableRule" }],
    });

    // act
    const results = [];
    for (const did of [viewer.did, post.accountDid]) {
      loginAs(did);
      const res = await client.call(getPosts, {
        uris: [asAtUriString(post.uri)],
      });
      results.push(res.posts[0]?.viewer?.embeddingDisabled);
    }

    // assert
    expect(results).toEqual([true, false]);
  });

  test("postgate-2: 引用された側が切り離した引用は、viewDetachedにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    const quoted = await createPost();
    const [detached, attached] = await Promise.all([
      createPost(),
      createPost(),
    ]);
    for (const post of [detached, attached]) {
      await postEmbedRecordFactory(ctx.db)
        .vars({ post: () => post, embeddedPost: () => quoted })
        .create();
    }
    await createPostgate(quoted, { detachedEmbeddingUris: [detached.uri] });

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(detached.uri), asAtUriString(attached.uri)],
    });

    // assert
    expect(res.posts.map((post) => post.embed)).toMatchObject([
      {
        $type: "app.bsky.embed.record#view",
        record: {
          $type: "app.bsky.embed.record#viewDetached",
          uri: quoted.uri,
          detached: true,
        },
      },
      {
        $type: "app.bsky.embed.record#view",
        record: { $type: "app.bsky.embed.record#viewRecord", uri: quoted.uri },
      },
    ]);
  });
  test("postgate-3: 引用禁止に違反した引用は、viewDetachedにする", async () => {
    // arrange
    const { client } = await setupApiTest();
    const quoted = await createPost();
    const quote = await postFactory(ctx.db)
      .props({ violatesEmbeddingRules: () => true })
      .create();
    await postEmbedRecordFactory(ctx.db)
      .vars({ post: () => quote, embeddedPost: () => quoted })
      .create();

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(quote.uri)],
    });

    // assert
    expect(res.posts[0]?.embed).toMatchObject({
      $type: "app.bsky.embed.record#view",
      record: {
        $type: "app.bsky.embed.record#viewDetached",
        uri: quoted.uri,
        detached: true,
      },
    });
  });
  test("embed-1: 画像のギャラリーは、引用に添えたものも含めてgalleryのビューで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const quoted = await createPost();
    const [gallery, quote] = await Promise.all([createPost(), createPost()]);
    await postEmbedRecordFactory(ctx.db)
      .vars({ post: () => quote, embeddedPost: () => quoted })
      .create();
    for (const post of [gallery, quote]) {
      await postEmbedImageFactory(ctx.db)
        .vars({ post: () => post })
        .props({ position: () => 0, embedType: () => "gallery" as const })
        .create();
    }

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(gallery.uri), asAtUriString(quote.uri)],
    });

    // assert
    const galleryView = {
      $type: "app.bsky.embed.gallery#view",
      items: [{ $type: "app.bsky.embed.gallery#viewImage" }],
    };
    expect(res.posts.map((post) => post.embed)).toMatchObject([
      galleryView,
      {
        $type: "app.bsky.embed.recordWithMedia#view",
        media: galleryView,
      },
    ]);
  });

  test("embed-2: 動画は、再生用のプレイリストとサムネイルをvideo.bsky.appのURLにして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const post = await createPost();
    const video = await postEmbedVideoFactory(ctx.db)
      .vars({ post: () => post })
      .props({
        alt: () => "alt text",
        aspectRatioWidth: () => 1920,
        aspectRatioHeight: () => 1080,
        presentation: () => "gif",
      })
      .create();

    // act
    const res = await client.call(getPosts, {
      uris: [asAtUriString(post.uri)],
    });

    // assert
    const base = `https://video.bsky.app/watch/${post.accountDid}/${video.cid}`;
    expect(res.posts[0]?.embed).toEqual({
      $type: "app.bsky.embed.video#view",
      cid: video.cid,
      playlist: `${base}/playlist.m3u8`,
      thumbnail: `${base}/thumbnail.jpg`,
      alt: "alt text",
      aspectRatio: { width: 1920, height: 1080 },
      presentation: "gif",
    });
  });
});
