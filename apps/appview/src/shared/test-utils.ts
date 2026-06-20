import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTransactionManager,
} from "@repo/common/test";
import { ac } from "@repo/common/utils";

import { InMemoryActorRepository } from "../infrastructure/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsRepository } from "../infrastructure/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryAssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.in-memory.js";
import { InMemoryAuthorFeedRepository } from "../infrastructure/author-feed-repository/author-feed-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/generator-repository/generator-repository.in-memory.js";
import { InMemoryHandleResolver } from "../infrastructure/handle-resolver/handle-resolver.in-memory.js";
import { InMemoryInviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../infrastructure/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repost-repository/repost-repository.in-memory.js";
import { InMemorySubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.in-memory.js";
import { InMemoryTimelineRepository } from "../infrastructure/timeline-repository/timeline-repository.in-memory.js";
import { InMemoryTokenVerifier } from "../infrastructure/token-verifier/token-verifier.in-memory.js";
import type { Env } from "./env.js";
import { createAppRegistry } from "./registry.js";

const testEnv = {
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
  .replaceService("profileRepository", ac(InMemoryProfileRepository))
  .replaceService("actorRepository", ac(InMemoryActorRepository))
  .replaceService("actorStatsRepository", ac(InMemoryActorStatsRepository))
  .replaceService("handleResolver", ac(InMemoryHandleResolver))
  .replaceService("recordRepository", ac(InMemoryRecordRepository))
  .replaceService("postRepository", ac(InMemoryPostRepository))
  .replaceService("postStatsRepository", ac(InMemoryPostStatsRepository))
  .replaceService("timelineRepository", ac(InMemoryTimelineRepository))
  .replaceService("authorFeedRepository", ac(InMemoryAuthorFeedRepository))
  .replaceService("likeRepository", ac(InMemoryLikeRepository))
  .replaceService("repostRepository", ac(InMemoryRepostRepository))
  .replaceService("followRepository", ac(InMemoryFollowRepository))
  .replaceService("generatorRepository", ac(InMemoryGeneratorRepository))
  .replaceService("inviteCodeRepository", ac(InMemoryInviteCodeRepository))
  .replaceService("subscriptionRepository", ac(InMemorySubscriptionRepository))
  .replaceService("transactionManager", ac(InMemoryTransactionManager))
  .replaceService("assetUrlBuilder", ac(InMemoryAssetUrlBuilder))
  .replaceService("jobQueue", ac(InMemoryJobQueue))
  .replaceService("jobScheduler", ac(InMemoryJobScheduler))
  .replaceService("didCache", ac(InMemoryDidCache))
  .replaceService("didResolver", ac(InMemoryDidResolver))
  .replaceService("tokenVerifier", ac(InMemoryTokenVerifier));

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
