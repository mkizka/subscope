import {
  actorFactory,
  profileDetailedFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { testInjector } from "../../../test-utils.js";
import { GetSubscribersUseCase } from "./get-subscribers-use-case.js";

describe("GetSubscribersUseCase", () => {
  const getSubscribersUseCase = testInjector.injectClass(GetSubscribersUseCase);
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const profileRepo = testInjector.resolve("profileRepository");

  beforeEach(() => {
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
    profileRepo.add(profile1);
    const subscription1 = subscriptionFactory({
      actorDid: actor1.did,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    subscriptionRepo.add(subscription1);

    const actor2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: actor2.did,
      displayName: "Subscriber Two",
    });
    profileRepo.add(profile2);
    const subscription2 = subscriptionFactory({
      actorDid: actor2.did,
      createdAt: new Date("2024-01-01T00:00:01Z"),
    });
    subscriptionRepo.add(subscription2);

    // act
    const result = await getSubscribersUseCase.execute({
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
    const result = await getSubscribersUseCase.execute({
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
      profileRepo.add(profile);
      const subscription = subscriptionFactory({
        actorDid: actor.did,
        createdAt: new Date(`2024-01-01T00:00:0${index}Z`),
      });
      subscriptionRepo.add(subscription);
      actors.push({ actor, displayName: `Test User ${index}` });
    }

    // act
    const result = await getSubscribersUseCase.execute({
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
    profileRepo.add(profile1);
    subscriptionRepo.add(
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
    profileRepo.add(profile2);
    subscriptionRepo.add(
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
    profileRepo.add(profile3);
    subscriptionRepo.add(
      subscriptionFactory({
        actorDid: actor3.did,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      }),
    );

    // act - 最初のページ
    const firstPage = await getSubscribersUseCase.execute({
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
    const secondPage = await getSubscribersUseCase.execute({
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
