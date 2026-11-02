import getSubscriptionStatus from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import { actorFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getSubscriptionStatus", () => {
  const { ctx } = testSetup;

  test("getSubscriptionStatus-1: 閲覧者がサブスクライバーならisSubscriberをtrueにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    loginAs(subscriber.did);

    // act
    const result = await client.call(getSubscriptionStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
    });
  });

  test("getSubscriptionStatus-2: 閲覧者がサブスクライバーでなければisSubscriberをfalseにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const actor = await actorFactory(ctx.db).create();
    loginAs(actor.did);

    // act
    const result = await client.call(getSubscriptionStatus);

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#notSubscribed",
      isSubscriber: false,
    });
  });
});
