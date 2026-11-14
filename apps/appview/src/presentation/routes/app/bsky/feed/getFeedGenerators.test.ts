import { asAtUriString } from "@atproto/syntax";
import getFeedGenerators from "@repo/client/app/bsky/feed/getFeedGenerators";
import {
  accountFactory,
  generatorFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getFeedGenerators", () => {
  const { ctx } = testSetup;

  test("getFeedGenerators-1: 指定したフィードジェネレーターをgeneratorViewで返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const creator = await accountFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const generator = await generatorFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.generator")
            .vars({ account: () => creator })
            .create(),
      })
      .create();

    // act
    const res = await client.call(getFeedGenerators, {
      feeds: [asAtUriString(generator.uri)],
    });

    // assert
    expect(res.feeds).toMatchObject([
      { uri: generator.uri, creator: { did: creator.did } },
    ]);
  });
});
