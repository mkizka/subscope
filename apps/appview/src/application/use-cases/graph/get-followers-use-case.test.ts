import { asDid } from "@atproto/did";
import {
  actorFactory,
  followFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetFollowersUseCase", () => {
  let sut: TestServices["getFollowersUseCase"];
  let followRepository: TestServices["followRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getFollowersUseCase;
    followRepository = services.followRepository;
    profileRepository = services.profileRepository;
  });

  test("actorをフォローしているユーザーがいる場合、フォロワーの情報を返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    const follower = actorFactory();
    const followerProfile = profileDetailedFactory({
      actorDid: follower.did,
      displayName: "Follower User",
      handle: "follower.test",
    });
    profileRepository.add(followerProfile);

    const follow = followFactory({
      actorDid: follower.did,
      subjectDid: actor.did,
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
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower.did,
          handle: "follower.test",
          displayName: "Follower User",
        },
      ],
    });
  });

  test("actorをフォローしているユーザーがいない場合、空のfollowersを返す", async () => {
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
      followers: [],
    });
  });

  test("limitパラメータで指定した件数より多くのフォロワーがいる場合、指定件数のフォロワーとcursorを返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
    });
    profileRepository.add(actorProfile);

    const followers = [actorFactory(), actorFactory(), actorFactory()];

    for (const follower of followers) {
      const followerProfile = profileDetailedFactory({
        actorDid: follower.did,
      });
      profileRepository.add(followerProfile);

      const follow = followFactory({
        actorDid: follower.did,
        subjectDid: actor.did,
      });
      followRepository.add(follow);
    }

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 2,
    });

    // assert
    expect(result.followers).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("cursorを使用して2回目のリクエストを行った場合、次のページのフォロワーを重複なく返す", async () => {
    // arrange
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
    });
    profileRepository.add(actorProfile);

    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const followers = [
      actorFactory(),
      actorFactory(),
      actorFactory(),
      actorFactory(),
    ];

    followers.forEach((follower, i) => {
      const followerProfile = profileDetailedFactory({
        actorDid: follower.did,
      });
      profileRepository.add(followerProfile);

      const follow = followFactory({
        actorDid: follower.did,
        subjectDid: actor.did,
        createdAt: new Date(baseTime.getTime() + (i + 1) * 1000),
        indexedAt: new Date(baseTime.getTime() + (i + 1) * 1100),
      });
      followRepository.add(follow);
    });

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
    const actor = actorFactory();
    const actorProfile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "Actor User",
      handle: "actor.test",
    });
    profileRepository.add(actorProfile);

    const baseTime = new Date("2024-01-01T00:00:00.000Z");

    const follower1 = actorFactory();
    const follower1Profile = profileDetailedFactory({
      actorDid: follower1.did,
      displayName: "Follower 1",
      handle: "follower1.test",
    });
    profileRepository.add(follower1Profile);
    const follow1 = followFactory({
      actorDid: follower1.did,
      subjectDid: actor.did,
      createdAt: new Date(baseTime.getTime() + 1000),
      indexedAt: new Date(baseTime.getTime() + 1100),
    });
    followRepository.add(follow1);

    const follower2 = actorFactory();
    const follower2Profile = profileDetailedFactory({
      actorDid: follower2.did,
      displayName: "Follower 2",
      handle: "follower2.test",
    });
    profileRepository.add(follower2Profile);
    const follow2 = followFactory({
      actorDid: follower2.did,
      subjectDid: actor.did,
      createdAt: new Date(baseTime.getTime() + 2000),
      indexedAt: new Date(baseTime.getTime() + 2100),
    });
    followRepository.add(follow2);

    const follower3 = actorFactory();
    const follower3Profile = profileDetailedFactory({
      actorDid: follower3.did,
      displayName: "Follower 3",
      handle: "follower3.test",
    });
    profileRepository.add(follower3Profile);
    const follow3 = followFactory({
      actorDid: follower3.did,
      subjectDid: actor.did,
      createdAt: new Date(baseTime.getTime() + 3000),
      indexedAt: new Date(baseTime.getTime() + 3100),
    });
    followRepository.add(follow3);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
      limit: 50,
    });

    // assert - フォロワーが時刻順（降順）で取得できることを確認
    expect(result).toMatchObject({
      subject: {
        $type: "app.bsky.actor.defs#profileView",
        did: actor.did,
        handle: "actor.test",
        displayName: "Actor User",
      },
      followers: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower3.did,
          handle: "follower3.test",
          displayName: "Follower 3",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower2.did,
          handle: "follower2.test",
          displayName: "Follower 2",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: follower1.did,
          handle: "follower1.test",
          displayName: "Follower 1",
        },
      ],
    });
  });
});
