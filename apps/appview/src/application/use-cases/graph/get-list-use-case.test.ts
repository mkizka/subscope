import {
  listFactory,
  listItemFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetListUseCase", () => {
  let getListUseCase: TestServices["getListUseCase"];
  let listRepo: TestServices["listRepository"];
  let profileRepo: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getListUseCase = services.getListUseCase;
    listRepo = services.listRepository;
    profileRepo = services.profileRepository;
  });

  test("リストとその項目を新しい順にページングして返す", async () => {
    // arrange
    const creator = profileDetailedFactory();
    profileRepo.add(creator);
    const list = listFactory({ actorDid: creator.actorDid });
    listRepo.add(list);
    const itemAt = (day: number) => {
      const subject = profileDetailedFactory();
      profileRepo.add(subject);
      const item = listItemFactory({
        listUri: list.uri,
        subjectDid: subject.actorDid,
        createdAt: new Date(`2024-01-0${day}T00:00:00.000Z`),
      });
      listRepo.addItem(item);
      return item;
    };
    const older = itemAt(1);
    const newer = itemAt(2);
    const newest = itemAt(3);
    listRepo.addItem(listItemFactory());

    // act
    const firstPage = await getListUseCase.execute({
      listUri: list.uri,
      limit: 2,
    });
    const secondPage = await getListUseCase.execute({
      listUri: list.uri,
      limit: 2,
      cursor: firstPage?.cursor,
    });

    // assert
    expect(firstPage?.list).toMatchObject({
      uri: list.uri.toString(),
      creator: { did: creator.actorDid },
    });
    expect(firstPage?.items).toEqual([
      {
        uri: newest.uri.toString(),
        subject: expect.objectContaining({ did: newest.subjectDid }),
      },
      {
        uri: newer.uri.toString(),
        subject: expect.objectContaining({ did: newer.subjectDid }),
      },
    ]);
    expect(secondPage?.cursor).toBeUndefined();
    expect(secondPage?.items.map((item) => item.uri)).toEqual([
      older.uri.toString(),
    ]);
  });

  test("リストが存在しなければnullを返す", async () => {
    // act
    const result = await getListUseCase.execute({
      listUri: listFactory().uri,
      limit: 10,
    });

    // assert
    expect(result).toBeNull();
  });
});
