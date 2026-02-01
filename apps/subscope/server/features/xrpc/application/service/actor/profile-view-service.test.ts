import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import type { ActorStats } from "@/server/features/xrpc/application/interfaces/actor-stats-repository.js";
import { testInjector } from "@/server/features/xrpc/test-utils.js";

import { ProfileViewService } from "./profile-view-service.js";

describe("ProfileViewService", () => {
  const profileViewService = testInjector.injectClass(ProfileViewService);

  const profileRepo = testInjector.resolve("profileRepository");
  const actorStatsRepo = testInjector.resolve("actorStatsRepository");
  const followRepo = testInjector.resolve("followRepository");

  describe("findProfileViewBasic", () => {
    test("プロフィールが存在する場合、ProfileViewBasicを返す", async () => {
      // arrange
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        handle: actor.handle,
        displayName: "Test User",
      });
      profileRepo.add(profile);

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
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        handle: actor.handle,
        displayName: "Test User",
      });
      profileRepo.add(profile);

      const actorStats: ActorStats = {
        followsCount: 10,
        followersCount: 20,
        postsCount: 30,
      };
      actorStatsRepo.add(actor.did, actorStats);

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
        displayName: "Test User",
        followsCount: 10,
        followersCount: 20,
        postsCount: 30,
        indexedAt: expect.any(String),
      });
    });

    test("プロフィールは存在するが統計情報が存在しない場合、統計情報を0として返す", async () => {
      // arrange
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        handle: actor.handle,
        displayName: "Test User Without Stats",
      });
      profileRepo.add(profile);

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
        indexedAt: expect.any(String),
      });
    });

    test("複数のプロフィールに対して正しい統計情報を関連付ける", async () => {
      // arrange
      const actor1 = actorFactory();
      const profile1 = profileDetailedFactory({
        actorDid: actor1.did,
        displayName: "User 1",
      });
      profileRepo.add(profile1);

      const actorStats1: ActorStats = {
        followsCount: 5,
        followersCount: 10,
        postsCount: 15,
      };
      actorStatsRepo.add(actor1.did, actorStats1);

      const actor2 = actorFactory();
      const profile2 = profileDetailedFactory({
        actorDid: actor2.did,
        displayName: "User 2",
      });
      profileRepo.add(profile2);

      const actorStats2: ActorStats = {
        followsCount: 20,
        followersCount: 25,
        postsCount: 30,
      };
      actorStatsRepo.add(actor2.did, actorStats2);

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
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: "Test User",
      });
      profileRepo.add(profile);

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
      const viewerActor = actorFactory();
      const targetActor = actorFactory();
      const targetProfile = profileDetailedFactory({
        actorDid: targetActor.did,
        displayName: "Target User",
      });
      profileRepo.add(targetProfile);

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
      const viewerActor = actorFactory();
      const targetActor = actorFactory();
      const targetProfile = profileDetailedFactory({
        actorDid: targetActor.did,
        displayName: "Target User",
      });
      profileRepo.add(targetProfile);

      const follow = followFactory({
        actorDid: viewerActor.did,
        subjectDid: targetActor.did,
      });
      followRepo.add(follow);

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
          following: follow.uri.toString(),
          followedBy: undefined,
        },
      });
    });

    test("viewerDidが指定され、targetがviewerをフォローしている場合、followedByが設定されたviewerStateを返す", async () => {
      // arrange
      const viewerActor = actorFactory();
      const targetActor = actorFactory();
      const targetProfile = profileDetailedFactory({
        actorDid: targetActor.did,
        displayName: "Target User",
      });
      profileRepo.add(targetProfile);

      const follow = followFactory({
        actorDid: targetActor.did,
        subjectDid: viewerActor.did,
      });
      followRepo.add(follow);

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
          followedBy: follow.uri.toString(),
        },
      });
    });

    test("viewerDidが指定され、相互フォローの場合、followingとfollowedByの両方が設定されたviewerStateを返す", async () => {
      // arrange
      const viewerActor = actorFactory();
      const targetActor = actorFactory();
      const targetProfile = profileDetailedFactory({
        actorDid: targetActor.did,
        displayName: "Target User",
      });
      profileRepo.add(targetProfile);

      const followingFollow = followFactory({
        actorDid: viewerActor.did,
        subjectDid: targetActor.did,
      });
      followRepo.add(followingFollow);

      const followedByFollow = followFactory({
        actorDid: targetActor.did,
        subjectDid: viewerActor.did,
      });
      followRepo.add(followedByFollow);

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
          following: followingFollow.uri.toString(),
          followedBy: followedByFollow.uri.toString(),
        },
      });
    });

    test("viewerDidが指定され、複数のプロフィールに対して正しいviewerStateを関連付ける", async () => {
      // arrange
      const viewerActor = actorFactory();
      const target1Actor = actorFactory();
      const target2Actor = actorFactory();

      const target1Profile = profileDetailedFactory({
        actorDid: target1Actor.did,
        displayName: "Target 1",
      });
      profileRepo.add(target1Profile);

      const target2Profile = profileDetailedFactory({
        actorDid: target2Actor.did,
        displayName: "Target 2",
      });
      profileRepo.add(target2Profile);

      const follow1 = followFactory({
        actorDid: viewerActor.did,
        subjectDid: target1Actor.did,
      });
      followRepo.add(follow1);

      const follow2 = followFactory({
        actorDid: target2Actor.did,
        subjectDid: viewerActor.did,
      });
      followRepo.add(follow2);

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
          following: follow1.uri.toString(),
          followedBy: undefined,
        },
      });

      const target2Result = results.find((r) => r.did === target2Actor.did);
      expect(target2Result).toMatchObject({
        displayName: "Target 2",
        viewer: {
          $type: "app.bsky.actor.defs#viewerState",
          following: undefined,
          followedBy: follow2.uri.toString(),
        },
      });
    });
  });
});
