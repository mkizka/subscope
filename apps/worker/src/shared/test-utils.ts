import { createRegistry } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
  InMemoryTransactionManager,
} from "@repo/common/test";
import { ac } from "@repo/common/utils";

import { IndexActorService } from "../application/services/index-actor-service.js";
import { IndexRecordService } from "../application/services/index-record-service.js";
import { FollowIndexer } from "../application/services/indexer/follow-indexer.js";
import { GeneratorIndexer } from "../application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "../application/services/indexer/like-indexer.js";
import { PostIndexer } from "../application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "../application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "../application/services/indexer/repost-indexer.js";
import { AddTapRepoUseCase } from "../application/use-cases/async/add-tap-repo-use-case.js";
import { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
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
import { InMemoryJobLogger } from "./job-logger.in-memory.js";

// prettier-ignore
export const testRegistry = createRegistry()
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .value("db", {} as never)
  .service("actorRepository", () => new InMemoryActorRepository())
  .service("actorStatsRepository", () => new InMemoryActorStatsRepository())
  .service("feedItemRepository", () => new InMemoryFeedItemRepository())
  // subscriptionRepository must come before followRepository (InMemoryFollowRepository depends on it)
  .service("subscriptionRepository", () => new InMemorySubscriptionRepository())
  .service("followRepository", ["subscriptionRepository"], ac(InMemoryFollowRepository))
  .service("generatorRepository", () => new InMemoryGeneratorRepository())
  .service("inviteCodeRepository", () => new InMemoryInviteCodeRepository())
  .service("likeRepository", () => new InMemoryLikeRepository())
  .service("postRepository", () => new InMemoryPostRepository())
  .service("postStatsRepository", () => new InMemoryPostStatsRepository())
  .service("profileRepository", () => new InMemoryProfileRepository())
  .service("recordRepository", () => new InMemoryRecordRepository())
  .service("repostRepository", () => new InMemoryRepostRepository())
  .service("transactionManager", () => new InMemoryTransactionManager())
  .service("tapClient", () => new InMemoryTapClient())
  .service("jobQueue", () => new InMemoryJobQueue())
  .service("didResolver", () => new InMemoryDidResolver())
  .service("jobLogger", () => new InMemoryJobLogger())
  .service("jobScheduler", ["jobQueue"], ac(InMemoryJobScheduler))
  .service("indexActorService", ["actorRepository", "profileRepository", "jobScheduler"], ac(IndexActorService))
  .service("postIndexer", ["postRepository", "feedItemRepository", "jobScheduler"], ac(PostIndexer))
  .service("profileIndexer", ["profileRepository"], ac(ProfileIndexer))
  .service("followIndexer", ["followRepository", "jobScheduler", "indexActorService", "subscriptionRepository"], ac(FollowIndexer))
  .service("generatorIndexer", ["generatorRepository"], ac(GeneratorIndexer))
  .service("likeIndexer", ["likeRepository", "jobScheduler"], ac(LikeIndexer))
  .service("repostIndexer", ["repostRepository", "feedItemRepository", "postRepository", "jobScheduler"], ac(RepostIndexer))
  .service("indexRecordService", ["recordRepository", "indexActorService", "postIndexer", "profileIndexer", "followIndexer", "generatorIndexer", "likeIndexer", "repostIndexer"], ac(IndexRecordService))
  // use-cases
  .service("upsertIdentityUseCase", ["db", "indexActorService"], ac(UpsertIdentityUseCase))
  .service("indexCommitUseCase", ["transactionManager", "indexRecordService"], ac(IndexCommitUseCase))
  .service("resolveDidUseCase", ["didResolver", "actorRepository", "db"], ac(ResolveDidUseCase))
  .service("addTapRepoUseCase", ["tapClient"], ac(AddTapRepoUseCase));

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
