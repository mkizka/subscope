import { required } from "@repo/common/utils";
import {
  actorFactory,
  profileFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder.js";
import { FollowRepository } from "../../../infrastructure/follow-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import { ProfileViewService } from "../../service/actor/profile-view-service.js";
import { SubscriptionService } from "../../service/admin/subscription-service.js";
import { ProfileSearchService } from "../../service/search/profile-search-service.js";
import { GetSubscribersUseCase } from "./get-subscribers-use-case.js";

describe("GetSubscribersUseCase", () => {
  const { testInjector, ctx } = testSetup;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getSubscribersUseCase = testInjector
    .provideValue("publicUrl", "https://example.com")
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("assetUrlBuilder", AssetUrlBuilder)
    .provideClass("profileViewBuilder", ProfileViewBuilder)
    .provideClass("profileSearchService", ProfileSearchService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("subscriptionService", SubscriptionService)
    .injectClass(GetSubscribersUseCase);

  test("subscriberが存在する場合、ProfileViewの配列を返す", async () => {
    // arrange
    const actor1 = await actorFactory(ctx.db).create();
    const profileRecord1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor1 })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord1 })
      .props({ displayName: () => "Subscriber One" })
      .create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor1 })
      .props({ createdAt: () => new Date("2024-01-01T00:00:00Z") })
      .create();

    const actor2 = await actorFactory(ctx.db).create();
    const profileRecord2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor2 })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord2 })
      .props({ displayName: () => "Subscriber Two" })
      .create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor2 })
      .props({ createdAt: () => new Date("2024-01-01T00:00:01Z") })
      .create();

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
      const actor = await actorFactory(ctx.db).create();
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => actor })
        .create();
      await profileFactory(ctx.db)
        .vars({ record: () => profileRecord })
        .props({ displayName: () => `Test User ${index}` })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor })
        .props({ createdAt: () => new Date(`2024-01-01T00:00:0${index}Z`) })
        .create();
      actors.push({ actor, displayName: `Test User ${index}` });
    }

    // act
    const result = await getSubscribersUseCase.execute({
      limit: 2,
    });

    // assert
    const [, actor1, actor2] = actors;
    expect(result).toMatchObject({
      subscribers: [
        {
          did: required(actor2).actor.did,
          displayName: "Test User 2",
        },
        {
          did: required(actor1).actor.did,
          displayName: "Test User 1",
        },
      ],
      cursor: expect.any(String),
    });
  });

  test("cursorが指定された場合、その続きから返す", async () => {
    // arrange
    const actor1 = await actorFactory(ctx.db).create();
    const profileRecord1 = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor1 })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord1 })
      .props({ displayName: () => "First" })
      .create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor1 })
      .props({ createdAt: () => new Date("2024-01-01T00:00:02Z") })
      .create();

    const actor2 = await actorFactory(ctx.db).create();
    const profileRecord2 = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor2 })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord2 })
      .props({ displayName: () => "Second" })
      .create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor2 })
      .props({ createdAt: () => new Date("2024-01-01T00:00:01Z") })
      .create();

    const actor3 = await actorFactory(ctx.db).create();
    const profileRecord3 = await recordFactory(ctx.db, "app.bsky.actor.profile")
      .vars({ actor: () => actor3 })
      .create();
    await profileFactory(ctx.db)
      .vars({ record: () => profileRecord3 })
      .props({ displayName: () => "Third" })
      .create();
    await subscriptionFactory(ctx.db)
      .vars({ actor: () => actor3 })
      .props({ createdAt: () => new Date("2024-01-01T00:00:00Z") })
      .create();

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
