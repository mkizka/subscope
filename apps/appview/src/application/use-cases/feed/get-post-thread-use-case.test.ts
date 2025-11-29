import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { ResolvedAtUri } from "../../../domain/models/at-uri.js";
import { testInjector } from "../../../shared/test-utils.js";
import type { PostStats } from "../../interfaces/post-stats-repository.js";
import { GetPostThreadUseCase } from "./get-post-thread-use-case.js";

describe("GetPostThreadUseCase", () => {
  const getPostThreadUseCase = testInjector.injectClass(GetPostThreadUseCase);

  const postRepo = testInjector.resolve("postRepository");
  const postStatsRepo = testInjector.resolve("postStatsRepository");
  const profileRepo = testInjector.resolve("profileRepository");
  const recordRepo = testInjector.resolve("recordRepository");

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
  });

  test("親投稿も子投稿もない単一投稿の場合、parentとrepliesが空のThreadViewPostを返す", async () => {
    // arrange
    const actor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Single User",
    });
    profileRepo.add(profile);

    const { post, record } = postFactory({
      actorDid: actor.did,
    });
    postRepo.add(post);
    recordRepo.add(record);

    const postStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(post.uri.toString(), postStats);

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
        uri: post.uri.toString(),
        author: {
          displayName: "Single User",
        },
      },
      parent: undefined,
      replies: [],
    });
  });

  test("リプライ投稿の場合、親投稿の階層構造をparentに含むThreadViewPostを返す", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      displayName: "Root User",
    });
    profileRepo.add(rootProfile);

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const rootPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(rootPost.uri.toString(), rootPostStats);

    const parentActor = actorFactory();
    const parentProfile = profileDetailedFactory({
      actorDid: parentActor.did,
      displayName: "Parent User",
    });
    profileRepo.add(parentProfile);

    const { post: parentPost, record: parentRecord } = postFactory({
      actorDid: parentActor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: rootPost.uri, cid: rootPost.cid },
    });
    postRepo.add(parentPost);
    recordRepo.add(parentRecord);

    const parentPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(parentPost.uri.toString(), parentPostStats);

    const targetActor = actorFactory();
    const targetProfile = profileDetailedFactory({
      actorDid: targetActor.did,
      displayName: "Target User",
    });
    profileRepo.add(targetProfile);

    const { post: targetPost, record: targetRecord } = postFactory({
      actorDid: targetActor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: parentPost.uri, cid: parentPost.cid },
    });
    postRepo.add(targetPost);
    recordRepo.add(targetRecord);

    const targetPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(targetPost.uri.toString(), targetPostStats);

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
        uri: targetPost.uri.toString(),
        author: {
          displayName: "Target User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: parentPost.uri.toString(),
          author: {
            displayName: "Parent User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: rootPost.uri.toString(),
            author: {
              displayName: "Root User",
            },
          },
        },
      },
    });
  });

  test("子投稿がある投稿の場合、子投稿の階層構造をrepliesに含むThreadViewPostを返す", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      displayName: "Root User",
    });
    profileRepo.add(rootProfile);

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const rootPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(rootPost.uri.toString(), rootPostStats);

    const replyActor = actorFactory();
    const replyProfile = profileDetailedFactory({
      actorDid: replyActor.did,
      displayName: "Reply User",
    });
    profileRepo.add(replyProfile);

    const { post: replyPost, record: replyRecord } = postFactory({
      actorDid: replyActor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: rootPost.uri, cid: rootPost.cid },
    });
    postRepo.add(replyPost);
    recordRepo.add(replyRecord);

    const replyPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(replyPost.uri.toString(), replyPostStats);

    const grandchildActor = actorFactory();
    const grandchildProfile = profileDetailedFactory({
      actorDid: grandchildActor.did,
      displayName: "Grandchild User",
    });
    profileRepo.add(grandchildProfile);

    const { post: grandchildPost, record: grandchildRecord } = postFactory({
      actorDid: grandchildActor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: replyPost.uri, cid: replyPost.cid },
    });
    postRepo.add(grandchildPost);
    recordRepo.add(grandchildRecord);

    const grandchildPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(grandchildPost.uri.toString(), grandchildPostStats);

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
        uri: rootPost.uri.toString(),
        author: {
          displayName: "Root User",
        },
      },
      parent: undefined,
      replies: [
        {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: replyPost.uri.toString(),
            author: {
              displayName: "Reply User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: grandchildPost.uri.toString(),
                author: {
                  displayName: "Grandchild User",
                },
              },
            },
          ],
        },
      ],
    });
  });

  test("depthより大きい深さのリプライは取得しない", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      displayName: "Root User",
    });
    profileRepo.add(rootProfile);

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const rootPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(rootPost.uri.toString(), rootPostStats);

    const level1Actor = actorFactory();
    const level1Profile = profileDetailedFactory({
      actorDid: level1Actor.did,
      displayName: "Level 1 User",
    });
    profileRepo.add(level1Profile);

    const { post: level1Post, record: level1Record } = postFactory({
      actorDid: level1Actor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: rootPost.uri, cid: rootPost.cid },
    });
    postRepo.add(level1Post);
    recordRepo.add(level1Record);

    const level1PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level1Post.uri.toString(), level1PostStats);

    const level2Actor = actorFactory();
    const level2Profile = profileDetailedFactory({
      actorDid: level2Actor.did,
      displayName: "Level 2 User",
    });
    profileRepo.add(level2Profile);

    const { post: level2Post, record: level2Record } = postFactory({
      actorDid: level2Actor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: level1Post.uri, cid: level1Post.cid },
    });
    postRepo.add(level2Post);
    recordRepo.add(level2Record);

    const level2PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level2Post.uri.toString(), level2PostStats);

    const level3Actor = actorFactory();
    const level3Profile = profileDetailedFactory({
      actorDid: level3Actor.did,
      displayName: "Level 3 User",
    });
    profileRepo.add(level3Profile);

    const { post: level3Post, record: level3Record } = postFactory({
      actorDid: level3Actor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: level2Post.uri, cid: level2Post.cid },
    });
    postRepo.add(level3Post);
    recordRepo.add(level3Record);

    const level3PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level3Post.uri.toString(), level3PostStats);

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
        uri: rootPost.uri.toString(),
        author: {
          displayName: "Root User",
        },
      },
      parent: undefined,
      replies: [
        {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: level1Post.uri.toString(),
            author: {
              displayName: "Level 1 User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: level2Post.uri.toString(),
                author: {
                  displayName: "Level 2 User",
                },
              },
              replies: [],
            },
          ],
        },
      ],
    });
  });

  test("parentHeightより大きい高さの親投稿は取得しない", async () => {
    // arrange
    const level0Actor = actorFactory();
    const level0Profile = profileDetailedFactory({
      actorDid: level0Actor.did,
      displayName: "Level 0 User",
    });
    profileRepo.add(level0Profile);

    const { post: level0Post, record: level0Record } = postFactory({
      actorDid: level0Actor.did,
    });
    postRepo.add(level0Post);
    recordRepo.add(level0Record);

    const level0PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level0Post.uri.toString(), level0PostStats);

    const level1Actor = actorFactory();
    const level1Profile = profileDetailedFactory({
      actorDid: level1Actor.did,
      displayName: "Level 1 User",
    });
    profileRepo.add(level1Profile);

    const { post: level1Post, record: level1Record } = postFactory({
      actorDid: level1Actor.did,
      replyRoot: { uri: level0Post.uri, cid: level0Post.cid },
      replyParent: { uri: level0Post.uri, cid: level0Post.cid },
    });
    postRepo.add(level1Post);
    recordRepo.add(level1Record);

    const level1PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level1Post.uri.toString(), level1PostStats);

    const level2Actor = actorFactory();
    const level2Profile = profileDetailedFactory({
      actorDid: level2Actor.did,
      displayName: "Level 2 User",
    });
    profileRepo.add(level2Profile);

    const { post: level2Post, record: level2Record } = postFactory({
      actorDid: level2Actor.did,
      replyRoot: { uri: level0Post.uri, cid: level0Post.cid },
      replyParent: { uri: level1Post.uri, cid: level1Post.cid },
    });
    postRepo.add(level2Post);
    recordRepo.add(level2Record);

    const level2PostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(level2Post.uri.toString(), level2PostStats);

    const targetActor = actorFactory();
    const targetProfile = profileDetailedFactory({
      actorDid: targetActor.did,
      displayName: "Target User",
    });
    profileRepo.add(targetProfile);

    const { post: targetPost, record: targetRecord } = postFactory({
      actorDid: targetActor.did,
      replyRoot: { uri: level0Post.uri, cid: level0Post.cid },
      replyParent: { uri: level2Post.uri, cid: level2Post.cid },
    });
    postRepo.add(targetPost);
    recordRepo.add(targetRecord);

    const targetPostStats: PostStats = {
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
    };
    postStatsRepo.add(targetPost.uri.toString(), targetPostStats);

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
        uri: targetPost.uri.toString(),
        author: {
          displayName: "Target User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: level2Post.uri.toString(),
          author: {
            displayName: "Level 2 User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: level1Post.uri.toString(),
            author: {
              displayName: "Level 1 User",
            },
          },
          parent: undefined,
        },
      },
      replies: [],
    });
  });
});
