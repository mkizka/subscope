import { asDid } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import { ResolveDidUseCase } from "./resolve-did-use-case.js";

describe("ResolveDidUseCase", () => {
  const mockDidResolver = mock<IDidResolver>();
  const { testInjector, ctx } = testSetup;

  const resolveDidUseCase = testInjector
    .provideValue("didResolver", mockDidResolver)
    .provideClass("actorRepository", ActorRepository)
    .injectClass(ResolveDidUseCase);

  test("既存のactorが存在しない場合、新規actorを作成する", async () => {
    // arrange
    const did = asDid("did:plc:new-actor");
    const handle = "newactor.test";
    mockDidResolver.resolve.mockResolvedValue({
      handle,
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });

    // act
    await resolveDidUseCase.execute(did);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.did).toBe(did);
    expect(actors[0]?.handle).toBe(handle);
  });

  test("既存のactorが存在する場合、ハンドルを更新する", async () => {
    // arrange
    const oldHandle = "oldhandle.test";
    const newHandle = "newhandle.test";

    const actor = await actorFactory(ctx.db)
      .props({
        handle: () => oldHandle,
      })
      .create();

    mockDidResolver.resolve.mockResolvedValue({
      handle: newHandle,
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });

    // act
    await resolveDidUseCase.execute(asDid(actor.did));

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, actor.did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.did).toBe(actor.did);
    expect(actors[0]?.handle).toBe(newHandle);
  });
});
