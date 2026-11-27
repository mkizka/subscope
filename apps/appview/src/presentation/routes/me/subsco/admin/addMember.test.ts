import { asDid } from "@atproto/did";
import addMember from "@repo/client/me/subsco/admin/addMember";
import { schema } from "@repo/db";
import {
  accountFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupApiTest } from "../../../../../shared/api-test-utils.js";

describe("me.subsco.admin.addMember", () => {
  const { ctx } = testSetup;

  const did = asDid("did:plc:addmembertarget");

  const findRegistration = (accountDid: string) =>
    ctx.db.query.registrations.findFirst({
      where: eq(schema.registrations.accountDid, accountDid),
    });

  const setupAsAdmin = async () => {
    const api = await setupApiTest();
    const admin = await accountFactory(ctx.db)
      .props({ isAdmin: () => true })
      .create();
    api.loginAs(admin.did);
    api.didResolver.setResolveResult(did, {
      signingKey: "key",
      handle: "target.test",
      pds: new URL("https://pds.test"),
    });
    return api;
  };

  test("addMember-1: 指定したアカウントを招待コードなしでメンバーに登録し、Tapに追加する", async () => {
    // arrange
    const { client, jobScheduler } = await setupAsAdmin();

    // act
    await client.call(addMember, { actor: did });

    // assert
    expect(await findRegistration(did)).toMatchObject({ inviteCode: null });
    expect(jobScheduler.getSyncTapRepoJobs()).toEqual([{ did }]);
  });

  test("addMember-2: ハンドルを指定すると、DIDに解決して登録する", async () => {
    // arrange
    const { client, atprotoHandleResolver } = await setupAsAdmin();
    atprotoHandleResolver.add("target.test", did);

    // act
    await client.call(addMember, { actor: "target.test" });

    // assert
    expect(await findRegistration(did)).toBeDefined();
  });

  test("addMember-3: アカウントが見つからなければ400とAccountNotFoundを返す", async () => {
    // arrange
    const { client } = await setupAsAdmin();

    // act
    const results = await Promise.allSettled([
      client.call(addMember, { actor: "unknown.test" }),
      client.call(addMember, { actor: "did:plc:unknown" }),
    ]);

    // assert
    expect(results).toMatchObject([
      { reason: { status: 400, error: "AccountNotFound" } },
      { reason: { status: 400, error: "AccountNotFound" } },
    ]);
  });

  test("addMember-4: 登録済みのアカウントは登録せず、400とAlreadyRegisteredを返す", async () => {
    // arrange
    const { client } = await setupAsAdmin();
    const account = await accountFactory(ctx.db)
      .props({ did: () => did })
      .create();
    await registrationFactory(ctx.db)
      .vars({ account: () => account })
      .create();

    // act
    const promise = client.call(addMember, { actor: did });

    // assert
    await expect(promise).rejects.toMatchObject({
      status: 400,
      error: "AlreadyRegistered",
    });
  });

  test("addMember-6: 管理者でなければ403を返す", async () => {
    // arrange
    const { client, loginAs } = await setupApiTest();
    const viewer = await accountFactory(ctx.db).create();
    loginAs(viewer.did);

    // act
    const promise = client.call(addMember, { actor: did });

    // assert
    await expect(promise).rejects.toMatchObject({ status: 403 });
    expect(await findRegistration(did)).toBeUndefined();
  });
});
