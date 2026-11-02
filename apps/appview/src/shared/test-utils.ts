import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTransactionManager,
} from "@repo/common/test";

import { InMemoryActorQuery } from "../infrastructure/actor-query/actor-query.in-memory.js";
import { InMemoryActorRepository } from "../infrastructure/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsQuery } from "../infrastructure/actor-stats-query/actor-stats-query.in-memory.js";
import { InMemoryAssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.in-memory.js";
import { InMemoryBackfillStatusQuery } from "../infrastructure/backfill-status-query/backfill-status-query.in-memory.js";
import { InMemoryFollowQuery } from "../infrastructure/follow-query/follow-query.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorQuery } from "../infrastructure/generator-query/generator-query.in-memory.js";
import { InMemoryHandleResolver } from "../infrastructure/handle-resolver/handle-resolver.in-memory.js";
import { InMemoryInviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.in-memory.js";
import { InMemoryLabelQuery } from "../infrastructure/label-query/label-query.in-memory.js";
import { InMemoryLikeQuery } from "../infrastructure/like-query/like-query.in-memory.js";
import { InMemoryListQuery } from "../infrastructure/list-query/list-query.in-memory.js";
import { InMemoryNotificationQuery } from "../infrastructure/notification-query/notification-query.in-memory.js";
import { InMemoryPostQuery } from "../infrastructure/post-query/post-query.in-memory.js";
import { InMemoryPostStatsQuery } from "../infrastructure/post-stats-query/post-stats-query.in-memory.js";
import { InMemoryProfileQuery } from "../infrastructure/profile-query/profile-query.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordQuery } from "../infrastructure/record-query/record-query.in-memory.js";
import { InMemoryRepostQuery } from "../infrastructure/repost-query/repost-query.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repost-repository/repost-repository.in-memory.js";
import { InMemorySubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.in-memory.js";
import { InMemoryTokenVerifier } from "../infrastructure/token-verifier/token-verifier.in-memory.js";
import type { Env } from "./env.js";
import { createAppRegistry } from "./registry.js";

export const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "error",
  PORT: 3001,
  PLC_URL: "https://plc.directory",
  PUBLIC_URL: "https://example.com",
  BLOB_PROXY_URL: "https://example.com",
  SERVICE_DID: "did:web:example.com",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/postgres",
  REDIS_URL: "redis://localhost:6379",
} satisfies Env;

// prettier-ignore
export const testRegistry = createAppRegistry(testEnv)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("db", {} as never)
  .replaceService("profileRepository", asClassArgs(InMemoryProfileRepository))
  .replaceService("backfillStatusQuery", asClassArgs(InMemoryBackfillStatusQuery))
  .replaceService("profileQuery", asClassArgs(InMemoryProfileQuery))
  .replaceService("labelQuery", asClassArgs(InMemoryLabelQuery))
  .replaceService("actorRepository", asClassArgs(InMemoryActorRepository))
  .replaceService("actorQuery", asClassArgs(InMemoryActorQuery))
  .replaceService("actorStatsQuery", asClassArgs(InMemoryActorStatsQuery))
  .replaceService("handleResolver", asClassArgs(InMemoryHandleResolver))
  .replaceService("recordQuery", asClassArgs(InMemoryRecordQuery))
  .replaceService("notificationQuery", asClassArgs(InMemoryNotificationQuery))
  .replaceService("generatorQuery", asClassArgs(InMemoryGeneratorQuery))
  .replaceService("likeQuery", asClassArgs(InMemoryLikeQuery))
  .replaceService("postQuery", asClassArgs(InMemoryPostQuery))
  .replaceService("postStatsQuery", asClassArgs(InMemoryPostStatsQuery))
  .replaceService("repostRepository", asClassArgs(InMemoryRepostRepository))
  .replaceService("repostQuery", asClassArgs(InMemoryRepostQuery))
  .replaceService("followRepository", asClassArgs(InMemoryFollowRepository))
  .replaceService("followQuery", asClassArgs(InMemoryFollowQuery))
  .replaceService("listQuery", asClassArgs(InMemoryListQuery))
  .replaceService("inviteCodeRepository", asClassArgs(InMemoryInviteCodeRepository))
  .replaceService("subscriptionRepository", asClassArgs(InMemorySubscriptionRepository))
  .replaceService("transactionManager", asClassArgs(InMemoryTransactionManager))
  .replaceService("assetUrlBuilder", asClassArgs(InMemoryAssetUrlBuilder))
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("tokenVerifier", asClassArgs(InMemoryTokenVerifier));

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
