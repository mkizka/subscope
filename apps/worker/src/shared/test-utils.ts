import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
  InMemoryTransactionManager,
} from "@repo/common/test";

import { InMemoryHandleResolver } from "../infrastructure/handle-resolver/handle-resolver.in-memory.js";
import { InMemoryPostQuery } from "../infrastructure/queries/post-query/post-query.in-memory.js";
import { InMemoryProfileQuery } from "../infrastructure/queries/profile-query/profile-query.in-memory.js";
import { InMemorySubscriptionQuery } from "../infrastructure/queries/subscription-query/subscription-query.in-memory.js";
import { InMemoryActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsRepository } from "../infrastructure/repositories/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryFeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/repositories/like-repository/like-repository.in-memory.js";
import { InMemoryListItemRepository } from "../infrastructure/repositories/list-item-repository/list-item-repository.in-memory.js";
import { InMemoryListRepository } from "../infrastructure/repositories/list-repository/list-repository.in-memory.js";
import { InMemoryNotificationRepository } from "../infrastructure/repositories/notification-repository/notification-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/repositories/post-repository/post-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/repositories/record-repository/record-repository.in-memory.js";
import { InMemoryRecordRevRepository } from "../infrastructure/repositories/record-rev-repository/record-rev-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.in-memory.js";
import type { Env } from "./env.js";
import { createWorkerRegistry } from "./registry.js";

export const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "error",
  PORT: 3003,
  PLC_URL: "https://plc.directory",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/postgres",
  REDIS_URL: "redis://localhost:6379",
  TAP_URL: "http://localhost:2480",
  MODERATION_URL: "https://mod.bsky.app",
  TAP_CONCURRENCY: 64,
  DATABASE_POOL_MAX: 32,
} satisfies Env;

// prettier-ignore
export const testRegistry = createWorkerRegistry(testEnv)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("db", {} as never)
  .replaceService("actorRepository", asClassArgs(InMemoryActorRepository))
  .replaceService("actorStatsRepository", asClassArgs(InMemoryActorStatsRepository))
  .replaceService("feedItemRepository", asClassArgs(InMemoryFeedItemRepository))
  .replaceService("followRepository", asClassArgs(InMemoryFollowRepository))
  .replaceService("generatorRepository", asClassArgs(InMemoryGeneratorRepository))
  .replaceService("likeRepository", asClassArgs(InMemoryLikeRepository))
  .replaceService("listRepository", asClassArgs(InMemoryListRepository))
  .replaceService("listItemRepository", asClassArgs(InMemoryListItemRepository))
  .replaceService("notificationRepository", asClassArgs(InMemoryNotificationRepository))
  .replaceService("postRepository", asClassArgs(InMemoryPostRepository))
  .replaceService("profileRepository", asClassArgs(InMemoryProfileRepository))
  .replaceService("postQuery", ["postRepository"], asClassArgs(InMemoryPostQuery))
  .replaceService("profileQuery", ["profileRepository"], asClassArgs(InMemoryProfileQuery))
  .replaceService("recordRepository", asClassArgs(InMemoryRecordRepository))
  .replaceService("recordRevRepository", asClassArgs(InMemoryRecordRevRepository))
  .replaceService("repostRepository", asClassArgs(InMemoryRepostRepository))
  .replaceService("subscriptionQuery", asClassArgs(InMemorySubscriptionQuery))
  .replaceService("transactionManager", asClassArgs(InMemoryTransactionManager))
  .replaceService("tapClient", asClassArgs(InMemoryTapClient))
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("handleResolver", asClassArgs(InMemoryHandleResolver))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("syncWorker", {} as never);

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;

export const afterCommit = (task: () => Promise<void>) => void task();
