import type { IJobQueue, TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/actor-repository.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { IndexActorService } from "../../services/index-actor-service.js";
import { BackfillService } from "../../services/scheduler/backfill-service.js";
import { FetchProfileService } from "../../services/scheduler/fetch-profile-service.js";
import { ResolveDidService } from "../../services/scheduler/resolve-did-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";
import { UpsertIdentityUseCase } from "./upsert-identity-use-case.js";

let upsertIdentityUseCase: UpsertIdentityUseCase;
let ctx: TransactionContext;

const mockJobQueue = mock<IJobQueue>();
const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  upsertIdentityUseCase = testSetup.testInjector
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("resolveDidService", ResolveDidService)
    .provideClass("backfillService", BackfillService)
    .provideClass("fetchProfileService", FetchProfileService)
    .provideClass("indexActorService", IndexActorService)
    .injectClass(UpsertIdentityUseCase);
  ctx = testSetup.ctx;
});

describe("UpsertIdentityUseCase", () => {
  it("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(0);
  });

  it("subscriberの場合はactorを保存する", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-subscriber",
      handle: "identity-subscriber.bsky.social",
    };

    // actorを先に作成
    await ctx.db.insert(schema.actors).values({
      did: command.did,
      handle: "old-handle.bsky.social",
    });

    // subscriberとして登録
    await ctx.db.insert(schema.records).values({
      uri: "at://did:plc:identity-subscriber/dev.mkizka.test.subscription/123",
      cid: "sub123",
      actorDid: command.did,
      json: {
        $type: "dev.mkizka.test.subscription",
        appviewDid: "did:web:appview.test",
        createdAt: new Date().toISOString(),
      },
    });
    await ctx.db.insert(schema.subscriptions).values({
      uri: "at://did:plc:identity-subscriber/dev.mkizka.test.subscription/123",
      cid: "sub123",
      actorDid: command.did,
      appviewDid: "did:web:appview.test",
      createdAt: new Date(),
    });

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.handle).toBe(command.handle);
  });

  it("subscriberでないがsubscriberのフォロワーがいる場合はactorを保存する", async () => {
    // arrange
    const subscriberDid = "did:plc:identity-follower-subscriber";
    const followedDid = "did:plc:identity-followed";
    const command: UpsertIdentityCommand = {
      did: followedDid,
      handle: "identity-followed.bsky.social",
    };

    // subscriberを作成
    await ctx.db.insert(schema.actors).values({
      did: subscriberDid,
      handle: "identity-follower-subscriber.bsky.social",
    });
    await ctx.db.insert(schema.records).values({
      uri: `at://${subscriberDid}/dev.mkizka.test.subscription/456`,
      cid: "sub456",
      actorDid: subscriberDid,
      json: {
        $type: "dev.mkizka.test.subscription",
        appviewDid: "did:web:appview.test",
        createdAt: new Date().toISOString(),
      },
    });
    await ctx.db.insert(schema.subscriptions).values({
      uri: `at://${subscriberDid}/dev.mkizka.test.subscription/456`,
      cid: "sub456",
      actorDid: subscriberDid,
      appviewDid: "did:web:appview.test",
      createdAt: new Date(),
    });

    // subscriberがfollowedDidをフォロー
    await ctx.db.insert(schema.records).values({
      uri: `at://${subscriberDid}/app.bsky.graph.follow/789`,
      cid: "follow789",
      actorDid: subscriberDid,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followedDid,
        createdAt: new Date().toISOString(),
      },
    });
    await ctx.db.insert(schema.follows).values({
      uri: `at://${subscriberDid}/app.bsky.graph.follow/789`,
      cid: "follow789",
      actorDid: subscriberDid,
      subjectDid: followedDid,
      createdAt: new Date(),
    });

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(1);
    expect(actors[0]?.handle).toBe(command.handle);
  });

  it("subscriberでもなくsubscriberのフォロワーもいない場合はactorを保存しない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:identity-unrelated",
      handle: "identity-unrelated.bsky.social",
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const actors = await ctx.db
      .select()
      .from(schema.actors)
      .where(eq(schema.actors.did, command.did));
    expect(actors.length).toBe(0);
  });
});
