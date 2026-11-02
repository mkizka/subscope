import createInviteCode from "@repo/client/lex/me/subsco/admin/createInviteCode";
import { actorFactory, testSetup } from "@repo/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.createInviteCode", () => {
  const { ctx } = testSetup;

  afterEach(() => {
    vi.useRealTimers();
  });

  test("createInviteCode-1: コードは公開URLのホスト名の「.」を「-」に置き換え、「-」と英小文字・数字のランダムな5文字を続けたものにする", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const result1 = await client.call(createInviteCode, { daysToExpire: 30 });
    const result2 = await client.call(createInviteCode, { daysToExpire: 30 });

    // assert
    expect(result1.code).toMatch(/^example-com-[a-z0-9]{5}$/);
    expect(result2.code).toMatch(/^example-com-[a-z0-9]{5}$/);
    expect(result1.code).not.toBe(result2.code);
  });

  test("createInviteCode-2: 有効期限はdaysToExpire日後にする", async () => {
    // arrange
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    const { client, loginAs } = await setupApiTest();
    const admin = await actorFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    loginAs(admin.did);

    // act
    const result = await client.call(createInviteCode, { daysToExpire: 7 });

    // assert
    expect(result.expiresAt).toBe("2025-01-08T00:00:00.000Z");
  });
});
