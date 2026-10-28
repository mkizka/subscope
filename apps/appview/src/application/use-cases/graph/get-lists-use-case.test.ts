import { listFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetListsUseCase", () => {
  let getListsUseCase: TestServices["getListsUseCase"];
  let listRepo: TestServices["listRepository"];
  let profileRepo: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getListsUseCase = services.getListsUseCase;
    listRepo = services.listRepository;
    profileRepo = services.profileRepository;
  });

  test("指定したpurposeのリストを新しい順にページングして返す", async () => {
    // arrange
    const profile = profileDetailedFactory();
    profileRepo.add(profile);
    const listAt = (day: number) =>
      listFactory({
        actorDid: profile.actorDid,
        createdAt: new Date(`2024-01-0${day}T00:00:00.000Z`),
      });
    const older = listAt(1);
    const newer = listAt(2);
    const newest = listAt(3);
    const modlist = listFactory({
      actorDid: profile.actorDid,
      purpose: "app.bsky.graph.defs#modlist",
    });
    [older, newer, newest, modlist].forEach((list) => listRepo.add(list));

    // act
    const firstPage = await getListsUseCase.execute({
      actorDid: profile.actorDid,
      limit: 2,
      purposes: ["curatelist"],
    });
    const secondPage = await getListsUseCase.execute({
      actorDid: profile.actorDid,
      limit: 2,
      cursor: firstPage.cursor,
      purposes: ["curatelist"],
    });

    // assert
    expect(firstPage.lists.map((list) => list.uri)).toEqual([
      newest.uri.toString(),
      newer.uri.toString(),
    ]);
    expect(firstPage.lists[0]).toMatchObject({
      name: newest.name,
      purpose: "app.bsky.graph.defs#curatelist",
      creator: { did: profile.actorDid },
    });
    expect(secondPage).toEqual({
      cursor: undefined,
      lists: [expect.objectContaining({ uri: older.uri.toString() })],
    });
  });
});
