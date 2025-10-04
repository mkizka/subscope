import { asDid } from "@atproto/did";
import {
  actorFactory,
  actorStatsFactory,
  followFactory,
  getTestSetup,
  profileFactory,
  recordFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { ProfileSearchService } from "../search/profile-search-service.js";
import { ProfileViewBuilder } from "./profile-view-builder.js";
import { ProfileViewService } from "./profile-view-service.js";

describe("ProfileViewService", () => {
  const { testInjector, ctx } = getTestSetup();

  const profileViewService = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .resolve("profileViewService");

  describe("findProfileViewBasic", () => {
    test("プロフィールが存在する場合、ProfileViewBasicを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const profile = await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
        })
        .props({
          displayName: () => "Test User",
          avatarCid: () => "test-avatar-cid",
        })
        .create();

      // act
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
        avatar: `http://localhost:3004/images/avatar_thumbnail/${actor.did}/${profile.avatarCid}.jpg`,
        createdAt: expect.any(String),
      });
    });

    test("プロフィールが存在しない場合、空の配列を返す", async () => {
      // arrange
      const nonExistentDid = "did:plc:nonexistent";

      // act
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
      const actor = await actorFactory(ctx.db).create();
      const profile = await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
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
      const results = await profileViewService.findProfileViewDetailed([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: actor.did,
        handle: actor.handle,
        displayName: profile.displayName,
        avatar: `http://localhost:3004/images/avatar_thumbnail/${actor.did}/${profile.avatarCid}.jpg`,
        banner: `http://localhost:3004/images/banner/${actor.did}/${profile.bannerCid}.jpg`,
        description: profile.description,
        followsCount: 10,
        followersCount: 20,
        postsCount: 30,
        createdAt: expect.any(String),
        indexedAt: expect.any(String),
      });
    });

    test("プロフィールは存在するが統計情報が存在しない場合、統計情報を0として返す", async () => {
      // arrange
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
      const results = await profileViewService.findProfileViewDetailed([
        nonExistentDid,
      ]);

      // assert
      expect(results).toEqual([]);
    });

    test("viewerDidが指定されない場合、空のviewerStateを含むProfileViewDetailedを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => actor })
              .create(),
        })
        .props({
          displayName: () => "Test User",
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed([
        asDid(actor.did),
      ]);

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: actor.did,
        displayName: "Test User",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
        },
      });
    });

    test("viewerDidが指定され、フォロー関係がない場合、空のviewerStateを含むProfileViewDetailedを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const targetActor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => targetActor })
              .create(),
        })
        .props({
          displayName: () => "Target User",
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed(
        [asDid(targetActor.did)],
        asDid(viewerActor.did),
      );

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: targetActor.did,
        displayName: "Target User",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: undefined,
          followedBy: undefined,
        },
      });
    });

    test("viewerDidが指定され、viewerがtargetをフォローしている場合、followingが設定されたviewerStateを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const targetActor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => targetActor })
              .create(),
        })
        .props({
          displayName: () => "Target User",
        })
        .create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followRecord })
        .props({
          actorDid: () => viewerActor.did,
          subjectDid: () => targetActor.did,
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed(
        [asDid(targetActor.did)],
        asDid(viewerActor.did),
      );

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: targetActor.did,
        displayName: "Target User",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: followRecord.uri,
          followedBy: undefined,
        },
      });
    });

    test("viewerDidが指定され、targetがviewerをフォローしている場合、followedByが設定されたviewerStateを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const targetActor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => targetActor })
              .create(),
        })
        .props({
          displayName: () => "Target User",
        })
        .create();

      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => targetActor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followRecord })
        .props({
          actorDid: () => targetActor.did,
          subjectDid: () => viewerActor.did,
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed(
        [asDid(targetActor.did)],
        asDid(viewerActor.did),
      );

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: targetActor.did,
        displayName: "Target User",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: undefined,
          followedBy: followRecord.uri,
        },
      });
    });

    test("viewerDidが指定され、相互フォローの場合、followingとfollowedByの両方が設定されたviewerStateを返す", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const targetActor = await actorFactory(ctx.db).create();
      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => targetActor })
              .create(),
        })
        .props({
          displayName: () => "Target User",
        })
        .create();

      // viewerがtargetをフォロー
      const followingRecord = await recordFactory(
        ctx.db,
        "app.bsky.graph.follow",
      )
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followingRecord })
        .props({
          actorDid: () => viewerActor.did,
          subjectDid: () => targetActor.did,
        })
        .create();

      // targetがviewerをフォロー
      const followedByRecord = await recordFactory(
        ctx.db,
        "app.bsky.graph.follow",
      )
        .vars({ actor: () => targetActor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followedByRecord })
        .props({
          actorDid: () => targetActor.did,
          subjectDid: () => viewerActor.did,
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed(
        [asDid(targetActor.did)],
        asDid(viewerActor.did),
      );

      // assert
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        $type: "app.bsky.actor.defs#profileViewDetailed",
        did: targetActor.did,
        displayName: "Target User",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: followingRecord.uri,
          followedBy: followedByRecord.uri,
        },
      });
    });

    test("viewerDidが指定され、複数のプロフィールに対して正しいviewerStateを関連付ける", async () => {
      // arrange
      const viewerActor = await actorFactory(ctx.db).create();
      const target1Actor = await actorFactory(ctx.db).create();
      const target2Actor = await actorFactory(ctx.db).create();

      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => target1Actor })
              .create(),
        })
        .props({ displayName: () => "Target 1" })
        .create();

      await profileFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.actor.profile")
              .vars({ actor: () => target2Actor })
              .create(),
        })
        .props({ displayName: () => "Target 2" })
        .create();

      // viewerがtarget1のみをフォロー
      const followRecord = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => viewerActor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followRecord })
        .props({
          actorDid: () => viewerActor.did,
          subjectDid: () => target1Actor.did,
        })
        .create();

      // target2のみがviewerをフォロー
      const followedByRecord = await recordFactory(
        ctx.db,
        "app.bsky.graph.follow",
      )
        .vars({ actor: () => target2Actor })
        .create();
      await followFactory(ctx.db)
        .vars({ record: () => followedByRecord })
        .props({
          actorDid: () => target2Actor.did,
          subjectDid: () => viewerActor.did,
        })
        .create();

      // act
      const results = await profileViewService.findProfileViewDetailed(
        [asDid(target1Actor.did), asDid(target2Actor.did)],
        asDid(viewerActor.did),
      );

      // assert
      expect(results).toHaveLength(2);

      const target1Result = results.find((r) => r.did === target1Actor.did);
      expect(target1Result).toMatchObject({
        displayName: "Target 1",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: followRecord.uri,
          followedBy: undefined,
        },
      });

      const target2Result = results.find((r) => r.did === target2Actor.did);
      expect(target2Result).toMatchObject({
        displayName: "Target 2",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: undefined,
          followedBy: followedByRecord.uri,
        },
      });
    });
  });
});
