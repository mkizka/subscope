import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetFollowsUseCase", () => {
  let sut: TestServices["getFollowsUseCase"];
  let followRepository: TestServices["followRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getFollowsUseCase;
    followRepository = services.followRepository;
    profileRepository = services.profileRepository;
  });

  test("actorがフォローしているユーザーがいる場合、フォローしているユーザーの情報を返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    const followedUser = actorFactory();
    const followedUserProfile = profileDetailedFactory({
      actorDid: followedUser.did,
      displayName: "Followed User",
      handle: "followed.test",
    });
    profileRepository.add(followedUserProfile);

    const follow = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser.did,
    });
    followRepository.add(follow);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser.did,
          handle: "followed.test",
          displayName: "Followed User",
        },
      ],
    });
  });

  test("actorがフォローしているユーザーがいない場合、空のfollowsを返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      follows: [],
    });
  });

  test("limitパラメータで指定した件数より多くのフォローがいる場合、指定件数のフォローとcursorを返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
    });
    profileRepository.add(actorProfile);

    const followedUsers = [actorFactory(), actorFactory(), actorFactory()];

    for (const followedUser of followedUsers) {
      const followedUserProfile = profileDetailedFactory({
        actorDid: followedUser.did,
      });
      profileRepository.add(followedUserProfile);

      const follow = followFactory({
        actorDid: actor.did,
        subjectDid: followedUser.did,
      });
      followRepository.add(follow);
    }

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert
    expect(result.follows).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("cursorを使用して2回目のリクエストを行った場合、次のページのフォローを重複なく返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const followedUser1 = actorFactory();
    const followedUser1Profile = profileDetailedFactory({
      actorDid: followedUser1.did,
      displayName: "User 1",
      handle: "user1.test",
    });
    profileRepository.add(followedUser1Profile);
    const follow1 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser1.did,
      createdAt: new Date(baseTime.getTime() + 1000),
      indexedAt: new Date(baseTime.getTime() + 1100),
    });
    followRepository.add(follow1);

    const followedUser2 = actorFactory();
    const followedUser2Profile = profileDetailedFactory({
      actorDid: followedUser2.did,
      displayName: "User 2",
      handle: "user2.test",
    });
    profileRepository.add(followedUser2Profile);
    const follow2 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser2.did,
      createdAt: new Date(baseTime.getTime() + 2000),
      indexedAt: new Date(baseTime.getTime() + 2100),
    });
    followRepository.add(follow2);

    const followedUser3 = actorFactory();
    const followedUser3Profile = profileDetailedFactory({
      actorDid: followedUser3.did,
      displayName: "User 3",
      handle: "user3.test",
    });
    profileRepository.add(followedUser3Profile);
    const follow3 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser3.did,
      createdAt: new Date(baseTime.getTime() + 3000),
      indexedAt: new Date(baseTime.getTime() + 3100),
    });
    followRepository.add(follow3);

    const followedUser4 = actorFactory();
    const followedUser4Profile = profileDetailedFactory({
      actorDid: followedUser4.did,
      displayName: "User 4",
      handle: "user4.test",
    });
    profileRepository.add(followedUser4Profile);
    const follow4 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser4.did,
      createdAt: new Date(baseTime.getTime() + 4000),
      indexedAt: new Date(baseTime.getTime() + 4100),
    });
    followRepository.add(follow4);

    // act - 最初のページを取得
    const firstPageResult = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert - 最初のページ
    expect(firstPageResult).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser4.did,
          handle: "user4.test",
          displayName: "User 4",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser3.did,
          handle: "user3.test",
          displayName: "User 3",
        },
      ],
    });

    // act - 2ページ目を取得
    const secondPageResult = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 2,
      cursor: firstPageResult.cursor,
    });

    // assert - 2ページ目
    expect(secondPageResult).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser2.did,
          handle: "user2.test",
          displayName: "User 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser1.did,
          handle: "user1.test",
          displayName: "User 1",
        },
      ],
    });
  });

  test("フォローが複数いる場合、sortAtの降順で返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const followedUser1 = actorFactory();
    const followedUser1Profile = profileDetailedFactory({
      actorDid: followedUser1.did,
      displayName: "User 1",
      handle: "user1.test",
    });
    profileRepository.add(followedUser1Profile);
    const follow1 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser1.did,
      createdAt: new Date(baseTime.getTime() + 1000),
      indexedAt: new Date(baseTime.getTime() + 1100),
    });
    followRepository.add(follow1);

    const followedUser2 = actorFactory();
    const followedUser2Profile = profileDetailedFactory({
      actorDid: followedUser2.did,
      displayName: "User 2",
      handle: "user2.test",
    });
    profileRepository.add(followedUser2Profile);
    const follow2 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser2.did,
      createdAt: new Date(baseTime.getTime() + 2000),
      indexedAt: new Date(baseTime.getTime() + 2100),
    });
    followRepository.add(follow2);

    const followedUser3 = actorFactory();
    const followedUser3Profile = profileDetailedFactory({
      actorDid: followedUser3.did,
      displayName: "User 3",
      handle: "user3.test",
    });
    profileRepository.add(followedUser3Profile);
    const follow3 = followFactory({
      actorDid: actor.did,
      subjectDid: followedUser3.did,
      createdAt: new Date(baseTime.getTime() + 3000),
      indexedAt: new Date(baseTime.getTime() + 3100),
    });
    followRepository.add(follow3);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - フォローが時刻順（降順）で取得できることを確認
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      follows: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser3.did,
          handle: "user3.test",
          displayName: "User 3",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser2.did,
          handle: "user2.test",
          displayName: "User 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: followedUser1.did,
          handle: "user1.test",
          displayName: "User 1",
        },
      ],
    });
  });
});
