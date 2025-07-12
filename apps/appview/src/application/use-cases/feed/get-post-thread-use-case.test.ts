import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test, vi } from "vitest";

import { ResolvedAtUri } from "../../../domain/models/at-uri.js";
import { AtUriService } from "../../../domain/service/at-uri-service.js";
import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { HandleResolver } from "../../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../../infrastructure/record-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { PostEmbedViewBuilder } from "../../service/feed/post-embed-view-builder.js";
import { PostViewService } from "../../service/feed/post-view-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetPostThreadUseCase } from "./get-post-thread-use-case.js";

describe("GetPostThreadUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const spyFindByUri = vi.spyOn(PostRepository.prototype, "findByUri");
  const spyFindPostView = vi.spyOn(PostViewService.prototype, "findPostView");
  const spyFindReplies = vi.spyOn(PostRepository.prototype, "findReplies");

  const getPostThreadUseCase = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetPostThreadUseCase);

  test("投稿が見つからない場合はnotFoundPostを返す", async () => {
    // act
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(
        "at://did:plc:notexist/app.bsky.feed.post/notexist",
      ),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toEqual({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://did:plc:notexist/app.bsky.feed.post/notexist",
      notFound: true,
    });
    // ターゲット投稿の取得1回のみ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    expect(spyFindReplies).toHaveBeenCalledTimes(0);
    expect(spyFindPostView).toHaveBeenCalledTimes(0);
  });

  test("親投稿も子投稿もない単一投稿の場合、parentとrepliesが空のThreadViewPostを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Single User" }))
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(post.uri),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: post.uri,
        author: {
          displayName: "Single User",
        },
      },
      parent: undefined,
      replies: [],
    });
    // ターゲット投稿とリプライ取得1回ずつ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("リプライ投稿の場合、親投稿の階層構造をparentに含むThreadViewPostを返す", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const parentActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Parent User" }))
      .create();
    const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => parentActor })
      .create();
    const parentPost = await postFactory(ctx.db)
      .vars({ record: () => parentRecord })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();

    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();
    const targetRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const targetPost = await postFactory(ctx.db)
      .vars({ record: () => targetRecord })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => parentPost.uri,
        replyParentCid: () => parentPost.cid,
      })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(targetPost.uri),
      depth: 6,
      parentHeight: 10,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: targetPost.uri,
        author: {
          displayName: "Target User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: parentPost.uri,
          author: {
            displayName: "Parent User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: rootPost.uri,
            author: {
              displayName: "Root User",
            },
          },
        },
      },
    });
    // ターゲット投稿1回、親2回取得
    expect(spyFindByUri).toHaveBeenCalledTimes(3);
    // ターゲット投稿のリプライを検索
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("子投稿がある投稿の場合、子投稿の階層構造をrepliesに含むThreadViewPostを返す", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const replyActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reply User" }))
      .create();
    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => replyActor })
      .create();
    const replyPost = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();

    const grandchildActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Grandchild User" }))
      .create();
    const grandchildRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => grandchildActor })
      .create();
    const grandchildPost = await postFactory(ctx.db)
      .vars({ record: () => grandchildRecord })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => replyPost.uri,
        replyParentCid: () => replyPost.cid,
      })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(rootPost.uri),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: rootPost.uri,
        author: {
          displayName: "Root User",
        },
      },
      parent: undefined,
      replies: [
        {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: replyPost.uri,
            author: {
              displayName: "Reply User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: grandchildPost.uri,
                author: {
                  displayName: "Grandchild User",
                },
              },
            },
          ],
        },
      ],
    });
    // ターゲット投稿の取得1回のみ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // ターゲット投稿のリプライ、リプライのリプライ、リプライのリプライのリプライ(これは結果無し)で3回
    expect(spyFindReplies).toHaveBeenCalledTimes(3);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("depthより大きい深さのリプライは取得しない", async () => {
    // arrange
    const rootActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const rootRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => rootActor })
      .create();
    const rootPost = await postFactory(ctx.db)
      .vars({ record: () => rootRecord })
      .create();

    const level1Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 1 User" }))
      .create();
    const level1Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level1Actor })
      .create();
    const level1Post = await postFactory(ctx.db)
      .vars({ record: () => level1Record })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();

    const level2Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 2 User" }))
      .create();
    const level2Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level2Actor })
      .create();
    const level2Post = await postFactory(ctx.db)
      .vars({ record: () => level2Record })
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => level1Post.uri,
        replyParentCid: () => level1Post.cid,
      })
      .create();

    const level3Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 3 User" }))
      .create();
    const level3Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level3Actor })
      .create();
    await postFactory(ctx.db)
      .vars({ record: () => level3Record })
      .props({
        text: () => "Level 3 reply (should not appear)",
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => level2Post.uri,
        replyParentCid: () => level2Post.cid,
      })
      .create();

    // act - depth=2で実行（Level 3は取得されないはず）
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(rootPost.uri),
      depth: 2,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: rootPost.uri,
        author: {
          displayName: "Root User",
        },
      },
      parent: undefined,
      replies: [
        {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: level1Post.uri,
            author: {
              displayName: "Level 1 User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: level2Post.uri,
                author: {
                  displayName: "Level 2 User",
                },
              },
              replies: [], // Level 3はdepth=2の制限により含まれない
            },
          ],
        },
      ],
    });
    // ターゲット投稿の取得で1回
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // depth=2の制限により、ルート投稿と深さ1の投稿のリプライのみ取得（計2回）
    expect(spyFindReplies).toHaveBeenCalledTimes(2);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("parentHeightより大きい高さの親投稿は取得しない", async () => {
    // arrange
    const level0Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 0 User" }))
      .create();
    const level0Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level0Actor })
      .create();
    const level0Post = await postFactory(ctx.db)
      .vars({ record: () => level0Record })
      .create();

    const level1Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 1 User" }))
      .create();
    const level1Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level1Actor })
      .create();
    const level1Post = await postFactory(ctx.db)
      .vars({ record: () => level1Record })
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level0Post.uri,
        replyParentCid: () => level0Post.cid,
      })
      .create();

    const level2Actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 2 User" }))
      .create();
    const level2Record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => level2Actor })
      .create();
    const level2Post = await postFactory(ctx.db)
      .vars({ record: () => level2Record })
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level1Post.uri,
        replyParentCid: () => level1Post.cid,
      })
      .create();

    const targetActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .create();
    const targetRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => targetActor })
      .create();
    const targetPost = await postFactory(ctx.db)
      .vars({ record: () => targetRecord })
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level2Post.uri,
        replyParentCid: () => level2Post.cid,
      })
      .create();

    // act - parentHeight=2で実行（Level 0は取得されないはず）
    const result = await getPostThreadUseCase.execute({
      uri: new ResolvedAtUri(targetPost.uri),
      depth: 6,
      parentHeight: 2,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: targetPost.uri,
        author: {
          displayName: "Target User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: level2Post.uri,
          author: {
            displayName: "Level 2 User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: level1Post.uri,
            author: {
              displayName: "Level 1 User",
            },
          },
          parent: undefined, // Level 0はparentHeight=2の制限により含まれない
        },
      },
      replies: [],
    });
    // ターゲット投稿で1回、親投稿チェーンで2回
    expect(spyFindByUri).toHaveBeenCalledTimes(3);
    // ターゲット投稿のリプライ取得1回のみ
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });
});
