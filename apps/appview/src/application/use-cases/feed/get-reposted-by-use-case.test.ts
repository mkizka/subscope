import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
  repostFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetRepostedByUseCase", () => {
  let sut: TestServices["getRepostedByUseCase"];
  let repostRepository: TestServices["repostRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getRepostedByUseCase;
    repostRepository = services.repostRepository;
    profileRepository = services.profileRepository;
  });

  test("リポストがない場合、空のrepostedByを返す", async () => {
    // arrange
    const actor = actorFactory();
    const { post } = postFactory({
      actorDid: actor.did,
    });

    // act
    const result = await sut.execute({
      uri: post.uri.toString(),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: post.uri.toString(),
      repostedBy: [],
    });
  });

  test("リポストがある場合、リポストしたユーザーのプロフィールを返す", async () => {
    // arrange
    const originalActor = actorFactory();
    const { post: originalPost } = postFactory({
      actorDid: originalActor.did,
    });

    const repostActor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: repostActor.did,
      displayName: "Reposter",
    });
    profileRepository.add(profile);

    const repost = repostFactory({
      actorDid: repostActor.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
    });
    repostRepository.add(repost);

    // act
    const result = await sut.execute({
      uri: originalPost.uri.toString(),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri.toString(),
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: repostActor.did,
          displayName: "Reposter",
        },
      ],
    });
  });

  test("複数のリポストがある場合、時系列の降順で返す", async () => {
    // arrange
    const originalActor = actorFactory();
    const { post: originalPost } = postFactory({
      actorDid: originalActor.did,
    });

    const firstReposter = actorFactory();
    const firstProfile = profileDetailedFactory({
      actorDid: firstReposter.did,
      displayName: "First Reposter",
    });
    profileRepository.add(firstProfile);

    const firstRepost = repostFactory({
      actorDid: firstReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    repostRepository.add(firstRepost);

    const secondReposter = actorFactory();
    const secondProfile = profileDetailedFactory({
      actorDid: secondReposter.did,
      displayName: "Second Reposter",
    });
    profileRepository.add(secondProfile);

    const secondRepost = repostFactory({
      actorDid: secondReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    repostRepository.add(secondRepost);

    // act
    const result = await sut.execute({
      uri: originalPost.uri.toString(),
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri.toString(),
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: secondReposter.did,
          displayName: "Second Reposter",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
  });

  test("limitパラメータによる制限が正しく動作する", async () => {
    // arrange
    const originalActor = actorFactory();
    const { post: originalPost } = postFactory({
      actorDid: originalActor.did,
    });

    const firstReposter = actorFactory();
    const firstProfile = profileDetailedFactory({
      actorDid: firstReposter.did,
      displayName: "First Reposter",
    });
    profileRepository.add(firstProfile);

    const firstRepost = repostFactory({
      actorDid: firstReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    repostRepository.add(firstRepost);

    const secondReposter = actorFactory();
    const secondProfile = profileDetailedFactory({
      actorDid: secondReposter.did,
      displayName: "Second Reposter",
    });
    profileRepository.add(secondProfile);

    const secondRepost = repostFactory({
      actorDid: secondReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    repostRepository.add(secondRepost);

    // act
    const result = await sut.execute({
      uri: originalPost.uri.toString(),
      limit: 1,
    });

    // assert
    expect(result).toMatchObject({
      uri: originalPost.uri.toString(),
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータによるページネーションが正しく動作する", async () => {
    // arrange
    const originalActor = actorFactory();
    const { post: originalPost } = postFactory({
      actorDid: originalActor.did,
    });

    const firstReposter = actorFactory();
    const firstProfile = profileDetailedFactory({
      actorDid: firstReposter.did,
      displayName: "First Reposter",
    });
    profileRepository.add(firstProfile);

    const firstRepost = repostFactory({
      actorDid: firstReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    repostRepository.add(firstRepost);

    const secondReposter = actorFactory();
    const secondProfile = profileDetailedFactory({
      actorDid: secondReposter.did,
      displayName: "Second Reposter",
    });
    profileRepository.add(secondProfile);

    const secondRepost = repostFactory({
      actorDid: secondReposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    repostRepository.add(secondRepost);

    // act - 最初のページ
    const firstPage = await sut.execute({
      uri: originalPost.uri.toString(),
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await sut.execute({
      uri: originalPost.uri.toString(),
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage).toMatchObject({
      uri: originalPost.uri.toString(),
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: firstReposter.did,
          displayName: "First Reposter",
        },
      ],
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage).toMatchObject({
      uri: originalPost.uri.toString(),
      repostedBy: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: secondReposter.did,
          displayName: "Second Reposter",
        },
      ],
    });
    expect(secondPage.cursor).toBeUndefined();
  });
});
