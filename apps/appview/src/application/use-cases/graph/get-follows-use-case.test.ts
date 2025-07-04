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

  test("limitパラメータが適用され、cursorが正しく設定される", async () => {
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
});
