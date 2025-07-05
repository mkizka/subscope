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
import { GetFollowsUseCase } from "./get-follows-use-case.js";

describe("GetFollowsUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const getFollowsUseCase = testInjector
    .provideClass("followRepository", FollowRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("followService", FollowService)
    .provideClass("profileViewService", ProfileViewService)
    .injectClass(GetFollowsUseCase);

  test("actorがフォローしているユーザーがいる場合、フォローしているユーザーの情報を返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();
    const followedUser = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Followed User" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser,
      })
      .create();

    // act
    const result = await getFollowsUseCase.execute({
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
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser.did,
          displayName: "Followed User",
        },
      ],
    });
  });

  test("actorがフォローしているユーザーがいない場合、空のfollowsを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // act
    const result = await getFollowsUseCase.execute({
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
      follows: [],
    });
  });

  test("limitパラメータで指定した件数より多くのフォローがいる場合、指定件数のフォローとcursorを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    const followedUsers = await Promise.all([
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User 1" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User 2" }))
        .create(),
      actorFactory(ctx.db)
        .use((t) => t.withProfile({ displayName: "User 3" }))
        .create(),
    ]);

    for (const followedUser of followedUsers) {
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => actor })
              .create(),
          followee: () => followedUser,
        })
        .create();
    }

    // act
    const result = await getFollowsUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert
    expect(result.follows).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("cursorを使用して2回目のリクエストを行った場合、次のページのフォローを重複なく返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // 異なる時刻でフォローを作成
    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const followedUser1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 1" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser1,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 1000), // 1秒後
        indexedAt: () => new Date(baseTime.getTime() + 1100), // indexedAtは少し後に設定
      })
      .create();

    const followedUser2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 2" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser2,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 2000), // 2秒後
        indexedAt: () => new Date(baseTime.getTime() + 2100), // indexedAtは少し後に設定
      })
      .create();

    const followedUser3 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 3" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser3,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 3000), // 3秒後
        indexedAt: () => new Date(baseTime.getTime() + 3100), // indexedAtは少し後に設定
      })
      .create();

    const followedUser4 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 4" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser4,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 4000), // 4秒後
        indexedAt: () => new Date(baseTime.getTime() + 4100), // indexedAtは少し後に設定
      })
      .create();

    // act - 最初のページを取得
    const firstPageResult = await getFollowsUseCase.execute({
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
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser4.did,
          displayName: "User 4",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser3.did,
          displayName: "User 3",
        },
      ],
    });

    // act - 2ページ目を取得
    const secondPageResult = await getFollowsUseCase.execute({
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
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser2.did,
          displayName: "User 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser1.did,
          displayName: "User 1",
        },
      ],
    });
  });

  test("フォローが複数いる場合、sortAtの降順で返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Actor User" }))
      .create();

    // 異なる時刻でフォローを作成
    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const followedUser1 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 1" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser1,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 1000), // 1秒後
        indexedAt: () => new Date(baseTime.getTime() + 1100), // indexedAtは少し後に設定
      })
      .create();

    const followedUser2 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 2" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser2,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 2000), // 2秒後
        indexedAt: () => new Date(baseTime.getTime() + 2100), // indexedAtは少し後に設定
      })
      .create();

    const followedUser3 = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "User 3" }))
      .create();
    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => actor })
            .create(),
        followee: () => followedUser3,
      })
      .props({
        createdAt: () => new Date(baseTime.getTime() + 3000), // 3秒後
        indexedAt: () => new Date(baseTime.getTime() + 3100), // indexedAtは少し後に設定
      })
      .create();

    // act
    const result = await getFollowsUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - フォローが時刻順（降順）で取得できることを確認
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        displayName: "Actor User",
      },
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser3.did,
          displayName: "User 3",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser2.did,
          displayName: "User 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser1.did,
          displayName: "User 1",
        },
      ],
    });
  });
});
