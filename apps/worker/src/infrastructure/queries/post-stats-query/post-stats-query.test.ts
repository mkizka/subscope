import { postFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { PostStatsQuery } from "./post-stats-query.js";

describe("PostStatsQuery", () => {
  const { ctx } = testSetup;

  test("aggregate-5: 返信制限に違反した返信は、返信数に数えない", async () => {
    // arrange
    const parent = await postFactory(ctx.db).create();
    for (const violatesThreadgate of [false, true]) {
      await postFactory(ctx.db)
        .use((t) => t.asReplyTo(parent))
        .props({ violatesThreadgate: () => violatesThreadgate })
        .create();
    }

    // act
    const stats = await new PostStatsQuery().countStats({
      ctx,
      uris: [parent.uri],
    });

    // assert
    expect(stats).toMatchObject([{ postUri: parent.uri, replyCount: 1 }]);
  });
});
