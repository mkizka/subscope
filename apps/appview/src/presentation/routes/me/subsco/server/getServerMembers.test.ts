import getServerMembers from "@repo/client/me/subsco/server/getServerMembers";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.server.getServerMembers", () => {
  const { ctx } = testSetup;

  test("getServerMembers-1: メンバーごとにprofileViewを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    await accountFactory(ctx.db).create();

    // act
    const res = await client.call(getServerMembers);

    // assert
    expect(res.serverMembers).toMatchObject([
      {
        profile: {
          did: serverMember.did,
          handle: serverMember.handle,
        },
      },
    ]);
  });

  test("getServerMembers-2: メンバーごとに管理者かどうかを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .props({ isAdmin: () => true })
      .create();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    const res = await client.call(getServerMembers);

    // assert
    expect(res.serverMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          profile: expect.objectContaining({ did: admin.did }),
          isAdmin: true,
        }),
        expect.objectContaining({
          profile: expect.objectContaining({ did: serverMember.did }),
          isAdmin: false,
        }),
      ]),
    );
  });

  test("getServerMembers-3: qを指定すると、表示名またはハンドルにqを含むメンバーだけを返す", async () => {
    // arrange
    const { client } = await setupApiTest();
    const byName = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .use((t) => t.withProfile({ displayName: "Needle Name" }))
      .create();
    const byHandle = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .props({ handle: () => "needle.test" })
      .create();
    await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .use((t) => t.withProfile({ displayName: "Other" }))
      .create();

    // act
    const res = await client.call(getServerMembers, { q: "NEEDLE" });

    // assert
    expect(res.serverMembers.map((a) => a.profile.did).sort()).toEqual(
      [byName.did, byHandle.did].sort(),
    );
  });
});
