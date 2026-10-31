import { asAtUriString, AtUri } from "@atproto/syntax";
import getPosts from "@repo/client/lex/app/bsky/feed/getPosts";
import {
  actorFactory,
  followFactory,
  likeFactory,
  listFactory,
  listItemFactory,
  postEmbedRecordFactory,
  postFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getPosts", () => {
  const { ctx } = testSetup;

  const createPost = (facets?: unknown[]) =>
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
    post: { uri: string; actorDid: string },
    allow?: unknown[],
  ) =>
    recordFactory(ctx.db, "app.bsky.feed.threadgate")
      .vars({ actorDid: () => post.actorDid })
      .props({
        uri: () =>
          AtUri.make(
            post.actorDid,
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
    post: { uri: string; actorDid: string },
    json: object,
  ) =>
    recordFactory(ctx.db, "app.bsky.feed.postgate")
      .vars({ actorDid: () => post.actorDid })
      .props({
        uri: () =>
          AtUri.make(
            post.actorDid,
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
              actor: () =>
                actorFactory(ctx.db)
                  .use((t) => t.withProfile({}))
                  .create(),
            })
            .create(),
      })
      .use((t) => t.asReplyTo(root))
      .create();

  const follow = (actor: { did: string }, followee: { did: string }) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actorDid: () => actor.did })
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
    const viewer = await actorFactory(ctx.db).create();
    const post = await createPost();
    const like = await likeFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.like")
            .vars({ actor: () => viewer })
            .create(),
        subject: () => post,
      })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ actor: () => viewer })
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

  test("threadgate-1: スレッドの起点の投稿は、そのthreadgateをthreadgateに含める", async () => {
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

  test("threadgate-2: 閲覧者がthreadgateで返信を許されていないスレッドの投稿は、viewer.replyDisabledをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
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

  test("threadgate-3: 起点の投稿者と、allowの規則(mentionRule・followingRule・followerRule)のどれかに合う閲覧者は、viewer.replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const mentioned = await actorFactory(ctx.db).create();
    const followed = await actorFactory(ctx.db).create();
    const follower = await actorFactory(ctx.db).create();
    const root = await createPost([
      {
        index: { byteStart: 0, byteEnd: 4 },
        features: [
          { $type: "app.bsky.richtext.facet#mention", did: mentioned.did },
        ],
      },
    ]);
    const author = { did: root.actorDid };
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

  test("threadgate-4: allowが無いthreadgateは、閲覧者のviewer.replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
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

  test("threadgate-5: allowのlistRuleのリストに入っている閲覧者は、viewer.replyDisabledをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
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

  test("threadgate-6: allowのlistRuleで指定したリストのうちインデックスしたものを、threadgate.listsにlistViewBasicとして含める", async () => {
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

  test("postgate-1: postgateのembeddingRulesにdisableRuleがある投稿は、投稿者以外の閲覧者のviewer.embeddingDisabledをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db).create();
    const post = await createPost();
    await createPostgate(post, {
      embeddingRules: [{ $type: "app.bsky.feed.postgate#disableRule" }],
    });

    // act
    const results = [];
    for (const did of [viewer.did, post.actorDid]) {
      loginAs(did);
      const res = await client.call(getPosts, {
        uris: [asAtUriString(post.uri)],
      });
      results.push(res.posts[0]?.viewer?.embeddingDisabled);
    }

    // assert
    expect(results).toEqual([true, false]);
  });

  test("postgate-2: 引用された投稿のpostgateのdetachedEmbeddingUrisに引用した投稿が含まれる場合、引用をviewDetachedにする", async () => {
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
});
