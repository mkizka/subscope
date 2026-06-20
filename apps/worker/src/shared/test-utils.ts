import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
  InMemoryTransactionManager,
} from "@repo/common/test";
import { ac } from "@repo/common/utils";

import { InMemoryActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsRepository } from "../infrastructure/repositories/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryFeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.in-memory.js";
import { InMemoryInviteCodeRepository } from "../infrastructure/repositories/invite-code-repository/invite-code-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/repositories/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/repositories/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../infrastructure/repositories/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/repositories/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.in-memory.js";
import { InMemorySubscriptionRepository } from "../infrastructure/repositories/subscription-repository/subscription-repository.in-memory.js";
import type { Env } from "./env.js";
import { createWorkerRegistry } from "./registry.js";

const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "error",
  PORT: 3003,
  PLC_URL: "https://plc.directory",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/postgres",
  REDIS_URL: "redis://localhost:6379",
  TAP_URL: "http://localhost:2480",
  COMMIT_WORKER_CONCURRENCY: 128,
} satisfies Env;

// prettier-ignore
export const testRegistry = createWorkerRegistry(testEnv)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("db", {} as never)
  .replaceService("actorRepository", ac(InMemoryActorRepository))
  .replaceService("actorStatsRepository", ac(InMemoryActorStatsRepository))
  .replaceService("feedItemRepository", ac(InMemoryFeedItemRepository))
  .replaceService("followRepository", ac(InMemoryFollowRepository))
  .replaceService("generatorRepository", ac(InMemoryGeneratorRepository))
  .replaceService("inviteCodeRepository", ac(InMemoryInviteCodeRepository))
  .replaceService("likeRepository", ac(InMemoryLikeRepository))
  .replaceService("postRepository", ac(InMemoryPostRepository))
  .replaceService("postStatsRepository", ac(InMemoryPostStatsRepository))
  .replaceService("profileRepository", ac(InMemoryProfileRepository))
  .replaceService("recordRepository", ac(InMemoryRecordRepository))
  .replaceService("repostRepository", ac(InMemoryRepostRepository))
  .replaceService("subscriptionRepository", ac(InMemorySubscriptionRepository))
  .replaceService("transactionManager", ac(InMemoryTransactionManager))
  .replaceService("tapClient", ac(InMemoryTapClient))
  .replaceService("jobQueue", ac(InMemoryJobQueue))
  .replaceService("didCache", ac(InMemoryDidCache))
  .replaceService("didResolver", ac(InMemoryDidResolver))
  .replaceService("jobScheduler", ac(InMemoryJobScheduler));

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
