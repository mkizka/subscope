import { asDatetimeString } from "@atproto/syntax";
import getUnreadCount from "@repo/client/lex/app/bsky/notification/getUnreadCount";
import updateSeen from "@repo/client/lex/app/bsky/notification/updateSeen";
import { schema } from "@repo/db";
import { actorFactory, recordFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("app.bsky.notification.updateSeen", () => {
  const { ctx } = testSetup;

  test("updateSeen-1: 認証がない場合、401を返す", async () => {
    // arrange
    const { client } = await setupApiTest();

    // act
    const promise = client.call(updateSeen, {
      seenAt: asDatetimeString(new Date().toISOString()),
    });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("updateSeen-2: 指定した時刻以前の通知を既読にする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const author = await actorFactory(ctx.db).create();
    for (const sortAt of ["2024-01-01", "2024-01-03"]) {
      const record = await recordFactory(ctx.db, "app.bsky.graph.follow")
        .vars({ actor: () => author })
        .create();
      await ctx.db.insert(schema.notifications).values({
        recordUri: record.uri,
        recipientDid: viewer.did,
        authorDid: author.did,
        reason: "follow",
        sortAt: new Date(sortAt),
      });
    }
    loginAs(viewer.did);

    // act
    await client.call(updateSeen, {
      seenAt: asDatetimeString(new Date("2024-01-02").toISOString()),
    });

    // assert
    const res = await client.call(getUnreadCount);
    expect(res).toEqual({ count: 1 });
  });
});
