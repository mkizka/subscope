import { asDid } from "@atproto/did";
import type { IJobQueue } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import { ProfileRepository } from "../../../infrastructure/repositories/profile-repository.js";
import { IndexActorService } from "../../services/index-actor-service.js";
import { FetchRecordScheduler } from "../../services/scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "../../services/scheduler/resolve-did-scheduler.js";
import type { HandleAccountCommand } from "./handle-account-command.js";
import { HandleAccountUseCase } from "./handle-account-use-case.js";

describe("HandleAccountUseCase", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = getTestSetup();

  const handleAccountUseCase = testInjector
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("resolveDidScheduler", ResolveDidScheduler)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .provideClass("indexActorService", IndexActorService)
    .injectClass(HandleAccountUseCase);

  test("ステータスがdeletedの場合、actorがデータベースから削除される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const command: HandleAccountCommand = {
      did: asDid(actor.did),
      status: "deleted",
      active: false,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    // act
    await handleAccountUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, actor.did));
    expect(actors).toHaveLength(0);
  });

  test("ステータスがdeleted以外の場合、何も処理しない", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const command: HandleAccountCommand = {
      did: asDid(actor.did),
      status: "deactivated",
      active: false,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    // act
    await handleAccountUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, actor.did));
    expect(actors).toMatchObject([actor]);
  });
});
