import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { beforeAll, describe, expect, test, vi } from "vitest";

import { HandleResolver } from "../infrastructure/handle-resolver.js";
import { PostRepository } from "../infrastructure/post-repository.js";
import { PostStatsRepository } from "../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository.js";
import { GetPostThreadUseCase } from "./get-post-thread-use-case.js";
import { AtUriService } from "./service/at-uri-service.js";
import { EmbedViewService } from "./service/embed-view-service.js";
import { PostViewService } from "./service/post-view-service.js";
import { ProfileViewService } from "./service/profile-view-service.js";

let getPostThreadUseCase: GetPostThreadUseCase;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

const spyFindByUri = vi.spyOn(PostRepository.prototype, "findByUri");
const spyFindPostView = vi.spyOn(PostViewService.prototype, "findPostView");
const spyFindReplies = vi.spyOn(PostRepository.prototype, "findReplies");

beforeAll(() => {
  const testSetup = getSetup();
  getPostThreadUseCase = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetPostThreadUseCase);
  ctx = testSetup.ctx;
});

describe("GetPostThreadUseCase", () => {
  test("投稿が見つからない場合はnotFoundPostを返す", async () => {
    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri("at://did:plc:notexist/app.bsky.feed.post/notexist"),
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
    const post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Single User" }))
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(post.uri),
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
    const rootPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const parentPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Parent User" }))
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();
    const targetPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => parentPost.uri,
        replyParentCid: () => parentPost.cid,
      })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(targetPost.uri),
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
    const rootPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const replyPost = await postFactory(ctx.db)
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .use((t) => t.withProfile({ displayName: "Reply User" }))
      .create();
    const grandchildPost = await postFactory(ctx.db)
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => replyPost.uri,
        replyParentCid: () => replyPost.cid,
      })
      .use((t) => t.withProfile({ displayName: "Grandchild User" }))
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(rootPost.uri),
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
    const rootPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root User" }))
      .create();
    const level1Post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 1 User" }))
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();
    const level2Post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 2 User" }))
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => level1Post.uri,
        replyParentCid: () => level1Post.cid,
      })
      .create();
    await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 3 User" }))
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
      uri: new AtUri(rootPost.uri),
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
    const level0Post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 0 User" }))
      .create();
    const level1Post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 1 User" }))
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level0Post.uri,
        replyParentCid: () => level0Post.cid,
      })
      .create();
    const level2Post = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Level 2 User" }))
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level1Post.uri,
        replyParentCid: () => level1Post.cid,
      })
      .create();
    const targetPost = await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Target User" }))
      .props({
        replyRootUri: () => level0Post.uri,
        replyRootCid: () => level0Post.cid,
        replyParentUri: () => level2Post.uri,
        replyParentCid: () => level2Post.cid,
      })
      .create();

    // act - parentHeight=2で実行（Level 0は取得されないはず）
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(targetPost.uri),
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

  test("handleが含まれるURIの場合、DIDに変換してから投稿を取得する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .create();
    await postFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Handle User" }))
      .vars({ record: () => record })
      .create();
    const originalUri = new AtUri(record.uri);
    const handleUri = AtUri.make(
      actor.handle!, // DIDをhandleに差し替えておく
      originalUri.collection,
      originalUri.rkey,
    );

    // act
    const result = await getPostThreadUseCase.execute({
      uri: handleUri,
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: record.uri,
        author: {
          displayName: "Handle User",
        },
      },
      parent: undefined,
      replies: [],
    });
    // ターゲット投稿の取得で1回
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // ターゲット投稿のリプライ取得1回のみ
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("handleが解決できない場合、notFoundPostを返す", async () => {
    // arrange
    const handleUri = new AtUri(
      "at://notfound.handle/app.bsky.feed.post/notfound123",
    );

    // act
    const result = await getPostThreadUseCase.execute({
      uri: handleUri,
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toEqual({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://notfound.handle/app.bsky.feed.post/notfound123",
      notFound: true,
    });
    // handle解決に失敗で以下はすべて実行されない
    expect(spyFindByUri).toHaveBeenCalledTimes(0);
    expect(spyFindReplies).toHaveBeenCalledTimes(0);
    expect(spyFindPostView).toHaveBeenCalledTimes(0);
  });
});
