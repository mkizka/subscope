import {
  actorFactory,
  likeFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetLikesUseCase", () => {
  let sut: TestServices["getLikesUseCase"];
  let likeRepository: TestServices["likeRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getLikesUseCase;
    likeRepository = services.likeRepository;
    profileRepository = services.profileRepository;
  });

  test("投稿にいいねが付いている場合、いいねしたユーザーのプロフィールを含むレスポンスを返す", async () => {
    // arrange
    const targetActor = actorFactory();
    const likerActor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: likerActor.did,
      displayName: "Liker User",
    });
    profileRepository.add(profile);

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const like = likeFactory({
      actorDid: likerActor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepository.add(like);

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri.toString(),
      likes: [
        {
          $type: "app.bsky.feed.getLikes#like",
          actor: {
            did: likerActor.did,
            displayName: "Liker User",
          },
        },
      ],
    });
  });

  test("投稿にいいねが付いていない場合、空のlikesを返す", async () => {
    // arrange
    const targetActor = actorFactory();

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri.toString(),
      likes: [],
    });
  });

  test("limitパラメータが指定された場合、指定した件数分のいいねを返しカーソルを含む", async () => {
    // arrange
    const targetActor = actorFactory();
    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const likerActors = [actorFactory(), actorFactory(), actorFactory()];

    for (const likerActor of likerActors) {
      const profile = profileDetailedFactory({
        actorDid: likerActor.did,
      });
      profileRepository.add(profile);

      const like = likeFactory({
        actorDid: likerActor.did,
        subjectUri: post.uri.toString(),
        subjectCid: post.cid,
      });
      likeRepository.add(like);
    }

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      limit: 2,
    });

    // assert
    expect(result.likes).toHaveLength(2);
    expect(result.cursor).toBeDefined();
  });

  test("カーソルを指定した場合、ページネーションが動作する", async () => {
    // arrange
    const targetActor = actorFactory();

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const firstLiker = actorFactory();
    const firstProfile = profileDetailedFactory({
      actorDid: firstLiker.did,
      displayName: "First Liker",
    });
    profileRepository.add(firstProfile);

    const secondLiker = actorFactory();
    const secondProfile = profileDetailedFactory({
      actorDid: secondLiker.did,
      displayName: "Second Liker",
    });
    profileRepository.add(secondProfile);

    const thirdLiker = actorFactory();
    const thirdProfile = profileDetailedFactory({
      actorDid: thirdLiker.did,
      displayName: "Third Liker",
    });
    profileRepository.add(thirdProfile);

    const firstLike = likeFactory({
      actorDid: firstLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    likeRepository.add(firstLike);

    const secondLike = likeFactory({
      actorDid: secondLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepository.add(secondLike);

    const thirdLike = likeFactory({
      actorDid: thirdLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T03:00:00.000Z"),
    });
    likeRepository.add(thirdLike);

    // act - 最初のページ（limit=2）
    const firstPage = await sut.execute({
      uri: post.uri.toString(),
      limit: 2,
    });

    // assert - 最新の2件が返される（sortAtの降順）
    expect(firstPage).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Third Liker",
          },
        },
        {
          actor: {
            displayName: "Second Liker",
          },
        },
      ],
      cursor: expect.any(String),
    });

    // act - 次のページ
    const secondPage = await sut.execute({
      uri: post.uri.toString(),
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert - 残りの1件が返される
    expect(secondPage).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "First Liker",
          },
        },
      ],
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("limitパラメータが0または1の場合、指定した件数のいいねを返す", async () => {
    // arrange
    const targetActor = actorFactory();
    const likerActor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: likerActor.did,
      displayName: "Liker User",
    });
    profileRepository.add(profile);

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const like = likeFactory({
      actorDid: likerActor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepository.add(like);

    // act - limit=0
    const zeroLimitResult = await sut.execute({
      uri: post.uri.toString(),
      limit: 0,
    });

    // assert
    expect(zeroLimitResult).toMatchObject({
      likes: [],
    });

    // act - limit=1
    const oneLimitResult = await sut.execute({
      uri: post.uri.toString(),
      limit: 1,
    });

    // assert
    expect(oneLimitResult).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Liker User",
          },
        },
      ],
    });
  });

  test("cidパラメータが指定された場合、レスポンスにcidを含む", async () => {
    // arrange
    const targetActor = actorFactory();

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      cid: post.cid,
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri.toString(),
      cid: post.cid,
      likes: [],
    });
  });

  test("複数のいいねがある場合、sortAt（createdAtとindexedAtの早い方）の降順でソートされて返す", async () => {
    // arrange
    const targetActor = actorFactory();

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const earlyLiker = actorFactory();
    const earlyProfile = profileDetailedFactory({
      actorDid: earlyLiker.did,
      displayName: "Early Liker",
    });
    profileRepository.add(earlyProfile);

    const latestLiker = actorFactory();
    const latestProfile = profileDetailedFactory({
      actorDid: latestLiker.did,
      displayName: "Latest Liker",
    });
    profileRepository.add(latestProfile);

    const middleLiker = actorFactory();
    const middleProfile = profileDetailedFactory({
      actorDid: middleLiker.did,
      displayName: "Middle Liker",
    });
    profileRepository.add(middleProfile);

    const earlyLike = likeFactory({
      actorDid: earlyLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:30:00.000Z"),
    });
    likeRepository.add(earlyLike);

    const latestLike = likeFactory({
      actorDid: latestLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:30:00.000Z"),
    });
    likeRepository.add(latestLike);

    const middleLike = likeFactory({
      actorDid: middleLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepository.add(middleLike);

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      limit: 50,
    });

    // assert
    // sortAtの降順：Latest(02:30) > Middle(02:00) > Early(01:00)
    expect(result).toMatchObject({
      likes: [
        {
          actor: {
            displayName: "Latest Liker",
          },
        },
        {
          actor: {
            displayName: "Middle Liker",
          },
        },
        {
          actor: {
            displayName: "Early Liker",
          },
        },
      ],
    });
  });
});
