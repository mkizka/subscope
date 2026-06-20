import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("SearchActorsUseCase", () => {
  let sut: TestServices["searchActorsUseCase"];
  let profileRepository: TestServices["profileRepository"];
  let actorStatsRepository: TestServices["actorStatsRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.searchActorsUseCase;
    profileRepository = services.profileRepository;
    actorStatsRepository = services.actorStatsRepository;
  });

  test("検索クエリが空の場合、空の結果を返す", async () => {
    // act
    const result = await sut.execute({
      query: "",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("空白文字のみの検索クエリの場合、空の結果を返す", async () => {
    // act
    const result = await sut.execute({
      query: "   ",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("検索クエリがundefinedの場合、空の結果を返す", async () => {
    // act
    const result = await sut.execute({
      query: undefined,
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("displayNameに検索クエリが含まれるアクターがある場合、そのアクターを返す", async () => {
    // arrange
    const matchActor = actorFactory();
    const matchProfile = profileDetailedFactory({
      actorDid: matchActor.did,
      displayName: "Test User 検索対象",
      handle: "match.test",
    });
    profileRepository.add(matchProfile);
    actorStatsRepository.add(matchActor.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    const noMatchActor = actorFactory();
    const noMatchProfile = profileDetailedFactory({
      actorDid: noMatchActor.did,
      displayName: "Different Name",
      handle: "nomatch.test",
    });
    profileRepository.add(noMatchProfile);
    actorStatsRepository.add(noMatchActor.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    // act
    const result = await sut.execute({
      query: "検索対象",
      limit: 10,
    });

    // assert
    expect(result).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: matchActor.did,
          handle: "match.test",
          displayName: "Test User 検索対象",
        },
      ],
    });
  });

  test("検索クエリに一致するアクターがない場合、空の配列を返す", async () => {
    // arrange
    const actor = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: actor.did,
      displayName: "No Match User",
    });
    profileRepository.add(profile);
    actorStatsRepository.add(actor.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    // act
    const result = await sut.execute({
      query: "存在しないキーワード",
      limit: 10,
    });

    // assert
    expect(result).toEqual({
      actors: [],
      cursor: undefined,
    });
  });

  test("limitパラメータが指定された場合、指定した件数で結果を制限する", async () => {
    // arrange
    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: "Limit Test User 1",
    });
    profileRepository.add(profile1);
    actorStatsRepository.add(actor1.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: "Limit Test User 2",
    });
    profileRepository.add(profile2);
    actorStatsRepository.add(actor2.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    // act
    const result = await sut.execute({
      query: "Limit Test",
      limit: 1,
    });

    // assert
    expect(result.actors.length).toBe(1);
    expect(result.cursor).toBeDefined();
  });

  test("cursorパラメータが指定された場合、ページネーションで次のページを返す", async () => {
    // arrange
    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: "ActorPaginationTest User 1",
      handle: "user1.test",
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    profileRepository.add(profile1);
    actorStatsRepository.add(actor1.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: "ActorPaginationTest User 2",
      handle: "user2.test",
      indexedAt: new Date("2024-01-02T00:00:00.000Z"),
    });
    profileRepository.add(profile2);
    actorStatsRepository.add(actor2.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    // act - 最初のページ
    const firstPage = await sut.execute({
      query: "ActorPaginationTest",
      limit: 1,
    });

    // act - 次のページ
    const secondPage = await sut.execute({
      query: "ActorPaginationTest",
      limit: 1,
      cursor: firstPage.cursor,
    });

    // assert
    expect(firstPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor2.did,
          handle: "user2.test",
          displayName: "ActorPaginationTest User 2",
        },
      ],
    });
    expect(firstPage.cursor).toBeDefined();

    expect(secondPage).toMatchObject({
      actors: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor1.did,
          handle: "user1.test",
          displayName: "ActorPaginationTest User 1",
        },
      ],
      cursor: undefined,
    });
  });

  test("displayNameまたはhandleのいずれかに検索クエリが含まれる場合、該当するアクターを返す", async () => {
    // arrange
    const displayNameActor = actorFactory();
    const displayNameProfile = profileDetailedFactory({
      actorDid: displayNameActor.did,
      displayName: "テスト User",
      handle: "different.handle.com",
    });
    profileRepository.add(displayNameProfile);
    actorStatsRepository.add(displayNameActor.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    const handleActor = actorFactory();
    const handleProfile = profileDetailedFactory({
      actorDid: handleActor.did,
      displayName: "Different Name",
      handle: "testhandle.example.com",
    });
    profileRepository.add(handleProfile);
    actorStatsRepository.add(handleActor.did, {
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
    });

    // act - displayNameで検索
    const displayNameResult = await sut.execute({
      query: "テスト",
      limit: 10,
    });

    // act - handleで検索
    const handleResult = await sut.execute({
      query: "testhandle",
      limit: 10,
    });

    // assert
    expect(displayNameResult.actors.length).toBe(1);
    expect(displayNameResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: displayNameActor.did,
      displayName: "テスト User",
    });

    expect(handleResult.actors.length).toBe(1);
    expect(handleResult.actors[0]).toMatchObject({
      $type: "app.bsky.actor.defs#profileView",
      did: handleActor.did,
      handle: "testhandle.example.com",
    });
  });
});
