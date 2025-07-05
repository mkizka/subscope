import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  getTestSetup,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { FollowService } from "../../service/graph/follow-service.js";
import { ProfileViewService } from "../../service/view/profile-view-service.js";
import { GetFollowersUseCase } from "./get-followers-use-case.js";

describe("GetFollowersUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const getFollowersUseCase = testInjector
    .provideClass("followRepository", FollowRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("followService", FollowService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(GetFollowersUseCase);

  test("actorをフォローしているユーザーがいる場合、フォロワーの情報を返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const follower = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Follower User" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower })
            .create(),
        followee: () => actor,
      })
      .create();

    // act
    const result = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower.did,
          displayName: "Follower User",
        },
      ],
    });
  });

  test("actorをフォローしているユーザーがいない場合、空のfollowersを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // act
    const result = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      followers: [],
    });
  });

  test("limitパラメータで指定した件数より多くのフォロワーがいる場合、指定件数のフォロワーとcursorを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    const followers = await Promise.all([
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 1" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 2" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 3" }))
        .create(),
    ]);

    for (const follower of followers) {
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => follower })
              .create(),
          followee: () => actor,
        })
        .create();
    }

    // act
    const result = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert
    expect(result.followers).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("cursorを使用して2回目のリクエストを行った場合、次のページのフォロワーを重複なく返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    const followers = await Promise.all([
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 1" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 2" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 3" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "Follower 4" }))
        .create(),
    ]);

    for (const follower of followers) {
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => follower })
              .create(),
          followee: () => actor,
        })
        .create();
    }

    // act - 最初のページを取得
    const firstPageResult = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert - 最初のページ
    expect(firstPageResult).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
        },
      ],
    });

    // act - 2ページ目を取得
    const secondPageResult = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
      cursor: firstPageResult.cursor,
    });

    // assert - 2ページ目
    expect(secondPageResult).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
        },
      ],
    });
  });

  test("フォロワーが複数いる場合、sortAtの降順で返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // 異なる時刻でフォロワーを作成
    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const follower1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Follower 1" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower1 })
            .create(),
        followee: () => actor,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 1000), // 1秒後
        indexedAt: () => new Date(baseTime.getTime() + 1100), // indexedAtは少し後に設定
      })
      .create();

    const follower2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Follower 2" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower2 })
            .create(),
        followee: () => actor,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 2000), // 2秒後
        indexedAt: () => new Date(baseTime.getTime() + 2100), // indexedAtは少し後に設定
      })
      .create();

    const follower3 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Follower 3" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => follower3 })
            .create(),
        followee: () => actor,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 3000), // 3秒後
        indexedAt: () => new Date(baseTime.getTime() + 3100), // indexedAtは少し後に設定
      })
      .create();

    // act
    const result = await getFollowersUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - フォロワーが時刻順（降順）で取得できることを確認
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower3.did,
          displayName: "Follower 3",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower2.did,
          displayName: "Follower 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower1.did,
          displayName: "Follower 1",
        },
      ],
    });
  });
});
