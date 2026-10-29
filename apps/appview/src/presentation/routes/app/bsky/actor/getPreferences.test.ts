import getPreferences from "@repo/client/lex/app/bsky/actor/getPreferences";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.actor.getPreferences", () => {
  test("getPreferences-1: Followingフィードをピン留めした設定を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const res = await client.call(getPreferences);

    // assert
    expect(res.preferences).toMatchObject([
      {
        $type: "app.bsky.actor.defs#savedFeedsPrefV2",
        items: [{ type: "timeline", value: "following", pinned: true }],
      },
    ]);
  });
});
