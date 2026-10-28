import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { setupTestServer } from "../../../../../shared/test-utils.js";

describe("app.bsky.actor.getProfile", () => {
  test("プロフィールがある場合、profileViewDetailedを返す", async () => {
    // arrange
    const { services, client } = await setupTestServer();
    const actor = actorFactory();
    services.profileRepository.add(
      profileDetailedFactory({ actorDid: actor.did, displayName: "Alice" }),
    );

    // act
    const res = await client.app.bsky.actor.getProfile({ actor: actor.did });

    // assert
    expect(res.data).toMatchObject({
      did: actor.did,
      displayName: "Alice",
    });
  });

  test("プロフィールがない場合、400を返す", async () => {
    // arrange
    const { client } = await setupTestServer();

    // act
    const promise = client.app.bsky.actor.getProfile({
      actor: actorFactory().did,
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 400 });
  });
});
