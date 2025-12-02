import type { IJobQueue } from "@repo/common/domain";
import { InMemoryTransactionManager } from "@repo/common/test";
import { createInjector } from "typed-inject";
import { beforeEach } from "vitest";
import { mock } from "vitest-mock-extended";

import { IndexActorService } from "../application/services/index-actor-service.js";
import { InMemoryAggregateActorStatsScheduler } from "../application/services/scheduler/aggregate-actor-stats-scheduler.in-memory.js";
import { FetchRecordScheduler } from "../application/services/scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "../application/services/scheduler/resolve-did-scheduler.js";
import { FollowIndexingPolicy } from "../domain/follow-indexing-policy.js";
import { GeneratorIndexingPolicy } from "../domain/generator-indexing-policy.js";
import { LikeIndexingPolicy } from "../domain/like-indexing-policy.js";
import { PostIndexingPolicy } from "../domain/post-indexing-policy.js";
import { ProfileIndexingPolicy } from "../domain/profile-indexing-policy.js";
import { RepostIndexingPolicy } from "../domain/repost-indexing-policy.js";
import { InMemoryActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsRepository } from "../infrastructure/repositories/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryFeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.in-memory.js";
import { InMemoryIndexTargetRepository } from "../infrastructure/repositories/index-target-repository/index-target-repository.in-memory.js";
import { InMemoryInviteCodeRepository } from "../infrastructure/repositories/invite-code-repository/invite-code-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/repositories/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/repositories/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../infrastructure/repositories/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/repositories/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.in-memory.js";
import { InMemorySubscriptionRepository } from "../infrastructure/repositories/subscription-repository/subscription-repository.in-memory.js";
import { InMemoryTrackedActorChecker } from "../infrastructure/repositories/tracked-actor-checker/tracked-actor-checker.in-memory.js";

const mockJobQueue = mock<IJobQueue>();

export const testInjector = createInjector()
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .provideValue("db", {} as never)
  .provideClass("actorRepository", InMemoryActorRepository)
  .provideClass("actorStatsRepository", InMemoryActorStatsRepository)
  .provideClass("feedItemRepository", InMemoryFeedItemRepository)
  .provideClass("followRepository", InMemoryFollowRepository)
  .provideClass("generatorRepository", InMemoryGeneratorRepository)
  .provideClass("indexTargetRepository", InMemoryIndexTargetRepository)
  .provideClass("inviteCodeRepository", InMemoryInviteCodeRepository)
  .provideClass("likeRepository", InMemoryLikeRepository)
  .provideClass("postRepository", InMemoryPostRepository)
  .provideClass("postStatsRepository", InMemoryPostStatsRepository)
  .provideClass("profileRepository", InMemoryProfileRepository)
  .provideClass("recordRepository", InMemoryRecordRepository)
  .provideClass("repostRepository", InMemoryRepostRepository)
  .provideClass("subscriptionRepository", InMemorySubscriptionRepository)
  .provideClass("trackedActorChecker", InMemoryTrackedActorChecker)
  .provideClass("transactionManager", InMemoryTransactionManager)
  .provideValue("jobQueue", mockJobQueue)
  .provideClass(
    "aggregateActorStatsScheduler",
    InMemoryAggregateActorStatsScheduler,
  )
  .provideClass("followIndexingPolicy", FollowIndexingPolicy)
  .provideClass("generatorIndexingPolicy", GeneratorIndexingPolicy)
  .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
  .provideClass("postIndexingPolicy", PostIndexingPolicy)
  .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
  .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
  .provideClass("resolveDidScheduler", ResolveDidScheduler)
  .provideClass("fetchRecordScheduler", FetchRecordScheduler)
  .provideClass("indexActorService", IndexActorService);

export const setupFiles = () => {
  beforeEach(() => {
    testInjector.resolve("actorRepository").clear();
    testInjector.resolve("actorStatsRepository").clear();
    testInjector.resolve("feedItemRepository").clear();
    testInjector.resolve("followRepository").clear();
    testInjector.resolve("generatorRepository").clear();
    testInjector.resolve("indexTargetRepository").clear();
    testInjector.resolve("inviteCodeRepository").clear();
    testInjector.resolve("likeRepository").clear();
    testInjector.resolve("postRepository").clear();
    testInjector.resolve("postStatsRepository").clear();
    testInjector.resolve("profileRepository").clear();
    testInjector.resolve("recordRepository").clear();
    testInjector.resolve("repostRepository").clear();
    testInjector.resolve("subscriptionRepository").clear();
    testInjector.resolve("aggregateActorStatsScheduler").clear();
  });
};
