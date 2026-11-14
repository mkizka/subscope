import { asAtIdentifierString } from "@atproto/syntax";
import getFollowers from "@repo/client/app/bsky/graph/getFollowers";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../shared/api-test-utils.js";

describe("フォロー状態", () => {
  const { ctx } = testSetup;

  test("viewerFollowing-1: 閲覧者がフォローしているアカウントのビューには、viewer.followingを含める", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const create = () =>
      accountFactory(ctx.db)
        .use((t) => t.withProfile({}))
        .create();
    const follow = (
      account: Awaited<ReturnType<typeof create>>,
      followee: Awaited<ReturnType<typeof create>>,
    ) =>
      followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ accountDid: () => account.did })
              .create(),
          followee: () => followee,
        })
        .create();
    const viewer = await create();
    const account = await create();
    const other = await create();
    await follow(other, account);
    const viewerFollow = await follow(viewer, other);
    loginAs(viewer.did);

    // act
    const res = await client.call(getFollowers, {
      actor: asAtIdentifierString(account.did),
    });

    // assert
    expect(res.followers[0]?.viewer?.following).toBe(viewerFollow.uri);
  });
});
