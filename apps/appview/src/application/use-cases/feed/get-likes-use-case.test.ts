import {
  actorFactory,
  likeFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { GetLikesUseCase } from "./get-likes-use-case.js";

describe("GetLikesUseCase", () => {
  const getLikesUseCase = testInjector.injectClass(GetLikesUseCase);

  const likeRepo = testInjector.resolve("likeRepository");
  const profileRepo = testInjector.resolve("profileRepository");

  test("投稿にいいねが付いている場合、いいねしたユーザーのプロフィールを含むレスポンスを返す", async () => {
    // arrange
    const targetActor = actorFactory();
    const likerActor = actorFactory();

    const profile = profileDetailedFactory({
      actorDid: likerActor.did,
      displayName: "Liker User",
    });
    profileRepo.add(profile);

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const like = likeFactory({
      actorDid: likerActor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(like);

    // act
    const result = await getLikesUseCase.execute({
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
    const result = await getLikesUseCase.execute({
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
      profileRepo.add(profile);

      const like = likeFactory({
        actorDid: likerActor.did,
        subjectUri: post.uri.toString(),
        subjectCid: post.cid,
      });
      likeRepo.add(like);
    }

    // act
    const result = await getLikesUseCase.execute({
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
    profileRepo.add(firstProfile);

    const secondLiker = actorFactory();
    const secondProfile = profileDetailedFactory({
      actorDid: secondLiker.did,
      displayName: "Second Liker",
    });
    profileRepo.add(secondProfile);

    const thirdLiker = actorFactory();
    const thirdProfile = profileDetailedFactory({
      actorDid: thirdLiker.did,
      displayName: "Third Liker",
    });
    profileRepo.add(thirdProfile);

    const firstLike = likeFactory({
      actorDid: firstLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    likeRepo.add(firstLike);

    const secondLike = likeFactory({
      actorDid: secondLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepo.add(secondLike);

    const thirdLike = likeFactory({
      actorDid: thirdLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T03:00:00.000Z"),
    });
    likeRepo.add(thirdLike);

    // act - 最初のページ（limit=2）
    const firstPage = await getLikesUseCase.execute({
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
    const secondPage = await getLikesUseCase.execute({
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
    profileRepo.add(profile);

    const { post } = postFactory({
      actorDid: targetActor.did,
    });

    const like = likeFactory({
      actorDid: likerActor.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
    });
    likeRepo.add(like);

    // act - limit=0
    const zeroLimitResult = await getLikesUseCase.execute({
      uri: post.uri.toString(),
      limit: 0,
    });

    // assert
    expect(zeroLimitResult).toMatchObject({
      likes: [],
    });

    // act - limit=1
    const oneLimitResult = await getLikesUseCase.execute({
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
    const result = await getLikesUseCase.execute({
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
    profileRepo.add(earlyProfile);

    const latestLiker = actorFactory();
    const latestProfile = profileDetailedFactory({
      actorDid: latestLiker.did,
      displayName: "Latest Liker",
    });
    profileRepo.add(latestProfile);

    const middleLiker = actorFactory();
    const middleProfile = profileDetailedFactory({
      actorDid: middleLiker.did,
      displayName: "Middle Liker",
    });
    profileRepo.add(middleProfile);

    const earlyLike = likeFactory({
      actorDid: earlyLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:30:00.000Z"),
    });
    likeRepo.add(earlyLike);

    const latestLike = likeFactory({
      actorDid: latestLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:30:00.000Z"),
    });
    likeRepo.add(latestLike);

    const middleLike = likeFactory({
      actorDid: middleLiker.did,
      subjectUri: post.uri.toString(),
      subjectCid: post.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    likeRepo.add(middleLike);

    // act
    const result = await getLikesUseCase.execute({
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
