import { asDid } from "@atproto/did";
import getBackfillStatuses from "@repo/client/me/subsco/sync/getBackfillStatuses";
import {
  accountFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.sync.getBackfillStatuses", () => {
  const { ctx } = testSetup;

  const createAccount = (backfillStatus?: "completed" | "error") =>
    accountFactory(ctx.db)
      .props({ backfillStatus: () => backfillStatus ?? null })
      .create();

  const createServerMember = () =>
    accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

  type Account = Awaited<ReturnType<typeof createAccount>>;

  const follow = (follower: Account, followee: Account) =>
    followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ account: () => follower })
            .create(),
        followee: () => followee,
      })
      .create();

  test("getBackfillStatuses-1: メンバーとそのフォロー先のbackfillStatusを返し、それ以外のアカウントは含めない", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();
    const followee = await createAccount("completed");
    const other = await createAccount("completed");
    const otherFollowee = await createAccount("completed");
    await follow(serverMember, followee);
    await follow(other, otherFollowee);

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [serverMember, followee, other, otherFollowee].map((a) =>
        asDid(a.did),
      ),
    });

    // assert
    expect(res.statuses.sort((a, b) => a.did.localeCompare(b.did))).toEqual(
      [
        { did: serverMember.did, status: "inProgress" },
        { did: followee.did, status: "completed" },
      ].sort((a, b) => a.did.localeCompare(b.did)),
    );
  });

  test("getBackfillStatuses-2: backfillStatusが未設定のアカウントはinProgressとして返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toEqual([
      { did: serverMember.did, status: "inProgress" },
    ]);
  });

  test("getBackfillStatuses-3: 認証なしで呼び出せる", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await createServerMember();

    // act
    const res = await client.call(getBackfillStatuses, {
      dids: [asDid(serverMember.did)],
    });

    // assert
    expect(res.statuses).toHaveLength(1);
  });
});
