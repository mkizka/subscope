import { asDid } from "@atproto/did";
import {
  actorFactory,
  actorStatsFactory,
  blobFactory,
  profileFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileViewService } from "./profile-view-service.js";

describe("ProfileViewService", () => {
  const { getSetup } = setupTestDatabase();

  const getProfileViewService = () => {
    const { testInjector } = getSetup();
    const container = testInjector
      .provideClass("profileRepository", ProfileRepository)
      .provideClass("actorStatsRepository", ActorStatsRepository)
      .provideClass("profileViewService", ProfileViewService);

    return container.resolve("profileViewService");
  };

  describe("findProfileViewBasic", () => {
    test("プロフィールが存在する場合、ProfileViewBasicを返す", async () => {
      // arrange
      const { ctx } = getSetup();
      const actor = await actorFactory(ctx.db).create();
      const avatar = await blobFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
          avatar: () => avatar,
        })
        .props({
          displayName: () => "Test User",
        })
        .create();

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewBasic([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewBasic",
        did: actor.did,
        handle: actor.handle,
        displayName: "Test User",
        avatar: `http://localhost:3004/images/avatar_thumbnail/${actor.did}/${avatar.cid}.jpg`,
        createdAt: expect.any(String),
      });
    });

    test("プロフィールが存在しない場合、空の配列を返す", async () => {
      // arrange
      const nonExistentDid = "did:plc:nonexistent";

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewBasic([
        nonExistentDid,
      ]);

      // assert
      expect(results).toEqual([]);
    });
  });

  describe("findProfileViewDetailed", () => {
    test("プロフィールと統計情報が存在する場合、統計情報を含むProfileViewDetailedを返す", async () => {
      // arrange
      const { ctx } = getSetup();
      const actor = await actorFactory(ctx.db).create();
      const avatar = await blobFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
          avatar: () => avatar,
        })
        .props({
          displayName: () => "Test User With Stats",
        })
        .create();
      await actorStatsFactory(ctx.db)
        .vars({ actor: () => actor })
        .props({
          followsCount: () => 10,
          followersCount: () => 20,
          postsCount: () => 30,
        })
        .create();

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewDetailed([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: actor.did,
        handle: actor.handle,
        displayName: "Test User With Stats",
        avatar: `http://localhost:3004/images/avatar_thumbnail/${actor.did}/${avatar.cid}.jpg`,
        followsCount: 10,
        followersCount: 20,
        postsCount: 30,
        createdAt: expect.any(String),
        indexedAt: expect.any(String),
      });
    });

    test("プロフィールは存在するが統計情報が存在しない場合、統計情報を0として返す", async () => {
      // arrange
      const { ctx } = getSetup();
      const actor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
        })
        .props({
          displayName: () => "Test User Without Stats",
        })
        .create();

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewDetailed([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: actor.did,
        handle: actor.handle,
        displayName: "Test User Without Stats",
        followsCount: 0,
        followersCount: 0,
        postsCount: 0,
        createdAt: expect.any(String),
        indexedAt: expect.any(String),
      });
    });

    test("複数のプロフィールに対して正しい統計情報を関連付ける", async () => {
      // arrange
      const { ctx } = getSetup();
      const actor1 = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor1 })
              .create(),
        })
        .props({ displayName: () => "User 1" })
        .create();
      await actorStatsFactory(ctx.db)
        .vars({ actor: () => actor1 })
        .props({
          followsCount: () => 5,
          followersCount: () => 10,
          postsCount: () => 15,
        })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor2 })
              .create(),
        })
        .props({ displayName: () => "User 2" })
        .create();
      await actorStatsFactory(ctx.db)
        .vars({ actor: () => actor2 })
        .props({
          followsCount: () => 20,
          followersCount: () => 25,
          postsCount: () => 30,
        })
        .create();

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewDetailed([
        asDid(actor1.did),
        asDid(actor2.did),
      ]);

      // assert
      expect(results).toHaveLength(2);

      const user1Result = results.find((r) => r.did === actor1.did);
      expect(user1Result).toMatchObject({
        displayName: "User 1",
        followsCount: 5,
        followersCount: 10,
        postsCount: 15,
      });

      const user2Result = results.find((r) => r.did === actor2.did);
      expect(user2Result).toMatchObject({
        displayName: "User 2",
        followsCount: 20,
        followersCount: 25,
        postsCount: 30,
      });
    });

    test("プロフィールが存在しない場合、空の配列を返す", async () => {
      // arrange
      const nonExistentDid = "did:plc:nonexistent";

      // act
      const profileViewService = getProfileViewService();
      const results = await profileViewService.findProfileViewDetailed([
        nonExistentDid,
      ]);

      // assert
      expect(results).toEqual([]);
    });
  });
});
