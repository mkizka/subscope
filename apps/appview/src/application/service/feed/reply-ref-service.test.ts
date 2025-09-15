import { AtUri } from "@atproto/syntax";
import { Post } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { GeneratorRepository } from "../../../infrastructure/generator-repository.js";
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { ProfileViewBuilder } from "../actor/profile-view-builder.js";
import { ProfileViewService } from "../actor/profile-view-service.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { GeneratorViewService } from "./generator-view-service.js";
import { PostEmbedViewBuilder } from "./post-embed-view-builder.js";
import { PostViewService } from "./post-view-service.js";
import { ReplyRefService } from "./reply-ref-service.js";

describe("ReplyRefService", () => {
  const { testInjector, ctx } = getTestSetup();

  const replyRefService = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("generatorViewService", GeneratorViewService)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("repostRepository", RepostRepository)
    .provideClass("likeRepository", LikeRepository)
    .provideClass("postViewService", PostViewService)
    .injectClass(ReplyRefService);

  test("リプライがない投稿のみの場合、空のMapを返す", async () => {
    // arrange
    const posts = [
      new Post({
        uri: new AtUri("at://user1/app.bsky.feed.post/1"),
        cid: "cid1",
        actorDid: "did:plc:user1",
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result).toEqual(new Map());
  });

  test("リプライがある場合、reply情報を含むMapを返す", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 1" }))
      .create();
    await actorFactory(ctx.db)
      .props({ did: () => "did:plc:user2", handle: () => "user2.test" })
      .create();

    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .create();
    const parentPost = await postFactory(ctx.db)
      .vars({ record: () => parentRecord })
      .create();

    const replyUri = new AtUri("at://did:plc:user2/app.bsky.feed.post/reply");

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user2",
        text: "Reply post",
        replyRoot: { uri: new AtUri(rootPost.uri), cid: "root-cid" },
        replyParent: { uri: new AtUri(parentPost.uri), cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri,
      },
      parent: {
        uri: parentPost.uri,
      },
    });
  });

  test("複数のリプライがある場合、すべてのreply情報を含むMapを返す", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 3" }))
      .props({ did: () => "did:plc:user3", handle: () => "user3.test" })
      .create();
    await actorFactory(ctx.db)
      .props({ did: () => "did:plc:user4", handle: () => "user4.test" })
      .create();
    await actorFactory(ctx.db)
      .props({ did: () => "did:plc:user5", handle: () => "user5.test" })
      .create();

    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .props({ cid: () => "root-cid-2" })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .props({ cid: () => "parent-cid-2" })
      .create();
    const parentPost = await postFactory(ctx.db)
      .vars({ record: () => parentRecord })
      .create();

    const reply1Uri = new AtUri("at://did:plc:user4/app.bsky.feed.post/reply1");
    const reply2Uri = new AtUri("at://did:plc:user5/app.bsky.feed.post/reply2");

    const posts = [
      new Post({
        uri: reply1Uri,
        cid: "reply1-cid",
        actorDid: "did:plc:user4",
        text: "Reply 1",
        replyRoot: { uri: new AtUri(rootPost.uri), cid: "root-cid-2" },
        replyParent: { uri: new AtUri(parentPost.uri), cid: "parent-cid-2" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
      new Post({
        uri: reply2Uri,
        cid: "reply2-cid",
        actorDid: "did:plc:user5",
        text: "Reply 2",
        replyRoot: { uri: new AtUri(rootPost.uri), cid: "root-cid-2" },
        replyParent: { uri: new AtUri(rootPost.uri), cid: "root-cid-2" }, // 同じrootへの直接リプライ
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(reply1Uri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri,
      },
      parent: {
        uri: parentPost.uri,
      },
    });
    expect(result.get(reply2Uri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri,
      },
      parent: {
        uri: rootPost.uri,
      },
    });
  });

  test("PostViewが見つからない場合、NotFoundPostを含むreply情報を返す", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:notfound/app.bsky.feed.post/root");
    const parentUri = new AtUri(
      "at://did:plc:notfound/app.bsky.feed.post/parent",
    );
    const replyUri = new AtUri("at://did:plc:user6/app.bsky.feed.post/reply");

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user6",
        text: "Reply post",
        replyRoot: { uri: rootUri, cid: "root-cid" },
        replyParent: { uri: parentUri, cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: rootUri.toString(),
        notFound: true,
      },
      parent: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: parentUri.toString(),
        notFound: true,
      },
    });
  });

  test("リプライとノーマル投稿が混在している場合、リプライのみを処理する", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 7" }))
      .props({ did: () => "did:plc:user7", handle: () => "user7.test" })
      .create();
    await actorFactory(ctx.db)
      .props({ did: () => "did:plc:user8", handle: () => "user8.test" })
      .create();
    await actorFactory(ctx.db)
      .props({ did: () => "did:plc:user9", handle: () => "user9.test" })
      .create();

    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .props({ cid: () => "root-cid-3" })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .props({ cid: () => "parent-cid-3" })
      .create();
    const parentPost = await postFactory(ctx.db)
      .vars({ record: () => parentRecord })
      .create();

    const replyUri = new AtUri("at://did:plc:user8/app.bsky.feed.post/reply");
    const normalUri = new AtUri("at://did:plc:user9/app.bsky.feed.post/normal");

    const posts = [
      new Post({
        uri: normalUri,
        cid: "normal-cid",
        actorDid: "did:plc:user9",
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user8",
        text: "Reply post",
        replyRoot: { uri: new AtUri(rootPost.uri), cid: "root-cid-3" },
        replyParent: { uri: new AtUri(parentPost.uri), cid: "parent-cid-3" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri,
      },
      parent: {
        uri: parentPost.uri,
      },
    });
    expect(result.get(normalUri.toString())).toBeUndefined();
  });
});
