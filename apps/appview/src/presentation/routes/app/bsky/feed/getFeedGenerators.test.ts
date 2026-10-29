import {
  actorFactory,
  generatorFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.feed.getFeedGenerators", () => {
  const { ctx } = testSetup;

  test("getFeedGenerators-1: 存在するフィードジェネレーターを指定した場合、そのgeneratorViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const creator = await actorFactory(ctx.db)
      .use((t) => t.withProfile({}))
      .create();
    const generator = await generatorFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.generator")
            .vars({ actor: () => creator })
            .create(),
      })
      .create();

    // act
    const res = await client.app.bsky.feed.getFeedGenerators({
      feeds: [generator.uri],
    });

    // assert
    expect(res.data.feeds).toMatchObject([
      { uri: generator.uri, creator: { did: creator.did } },
    ]);
  });
});
