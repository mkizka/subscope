import {
  actorFactory,
  profileDetailedFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSubscribersUseCase", () => {
  let sut: TestServices["getSubscribersUseCase"];
  let subscriptionRepository: TestServices["subscriptionRepository"];
  let profileRepository: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getSubscribersUseCase;
    subscriptionRepository = services.subscriptionRepository;
    profileRepository = services.profileRepository;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("subscriberが存在する場合、ProfileViewの配列を返す", async () => {
    // arrange
    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: "Subscriber One",
    });
    profileRepository.add(profile1);
    const subscription1 = subscriptionFactory({
      actorDid: actor1.did,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    subscriptionRepository.add(subscription1);

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: "Subscriber Two",
    });
    profileRepository.add(profile2);
    const subscription2 = subscriptionFactory({
      actorDid: actor2.did,
      createdAt: new Date("2024-01-01T00:00:01Z"),
    });
    subscriptionRepository.add(subscription2);

    // act
    const result = await sut.execute({
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subscribers: [
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor2.did,
          displayName: "Subscriber Two",
        },
        {
          $type: "app.bsky.actor.defs#profileView",
          did: actor1.did,
          displayName: "Subscriber One",
        },
      ],
      cursor: undefined,
    });
  });

  test("subscriberが存在しない場合、空の配列を返す", async () => {
    // arrange
    // データを作成しない

    // act
    const result = await sut.execute({
      limit: 50,
    });

    // assert
    expect(result).toMatchObject({
      subscribers: [],
      cursor: undefined,
    });
  });

  test("limitを超えるsubscriberが存在する場合、cursorを返す", async () => {
    // arrange
    const actors: Array<{ actor: { did: string }; displayName: string }> = [];
    for (let index = 0; index < 3; index++) {
      const actor = actorFactory();
      const profile = profileDetailedFactory({
        actorDid: actor.did,
        displayName: `Test User ${index}`,
      });
      profileRepository.add(profile);
      const subscription = subscriptionFactory({
        actorDid: actor.did,
        createdAt: new Date(`2024-01-01T00:00:0${index}Z`),
      });
      subscriptionRepository.add(subscription);
      actors.push({ actor, displayName: `Test User ${index}` });
    }

    // act
    const result = await sut.execute({
      limit: 2,
    });

    // assert
    const actor1 = actors[1];
    const actor2 = actors[2];
    expect(result).toMatchObject({
      subscribers: [
        {
          did: actor2?.actor.did,
          displayName: "Test User 2",
        },
        {
          did: actor1?.actor.did,
          displayName: "Test User 1",
        },
      ],
      cursor: expect.any(String),
    });
  });

  test("cursorが指定された場合、その続きから返す", async () => {
    // arrange
    const actor1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: actor1.did,
      displayName: "First",
    });
    profileRepository.add(profile1);
    subscriptionRepository.add(
      subscriptionFactory({
        actorDid: actor1.did,
        createdAt: new Date("2024-01-01T00:00:02Z"),
      }),
    );

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: "Second",
    });
    profileRepository.add(profile2);
    subscriptionRepository.add(
      subscriptionFactory({
        actorDid: actor2.did,
        createdAt: new Date("2024-01-01T00:00:01Z"),
      }),
    );

    const actor3 = actorFactory();
    const profile3 = profileDetailedFactory({
      actorDid: actor3.did,
      displayName: "Third",
    });
    profileRepository.add(profile3);
    subscriptionRepository.add(
      subscriptionFactory({
        actorDid: actor3.did,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      }),
    );

    // act - 最初のページ
    const firstPage = await sut.execute({
      limit: 2,
    });

    // assert
    expect(firstPage).toMatchObject({
      subscribers: [
        {
          did: actor1.did,
          displayName: "First",
        },
        {
          did: actor2.did,
          displayName: "Second",
        },
      ],
      cursor: expect.any(String),
    });

    // act - 次のページ
    const secondPage = await sut.execute({
      limit: 2,
      cursor: firstPage.cursor,
    });

    // assert
    expect(secondPage).toMatchObject({
      subscribers: [
        {
          did: actor3.did,
          displayName: "Third",
        },
      ],
      cursor: undefined,
    });
  });
});
