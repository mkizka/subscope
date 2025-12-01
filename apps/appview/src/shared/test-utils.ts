import { InMemoryTransactionManager } from "@repo/common/test";
import { createInjector } from "typed-inject";
import { beforeEach } from "vitest";

import { ProfileViewBuilder } from "../application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "../application/service/actor/profile-view-service.js";
import { InviteCodeService } from "../application/service/admin/invite-code-service.js";
import { SubscriptionService } from "../application/service/admin/subscription-service.js";
import { ActorLikesService } from "../application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "../application/service/feed/author-feed-service.js";
import { FeedProcessor } from "../application/service/feed/feed-processor.js";
import { GeneratorViewService } from "../application/service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "../application/service/feed/post-embed-view-builder.js";
import { PostViewService } from "../application/service/feed/post-view-service.js";
import { ReplyRefService } from "../application/service/feed/reply-ref-service.js";
import { RepostService } from "../application/service/feed/repost-service.js";
import { TimelineService } from "../application/service/feed/timeline-service.js";
import { FollowService } from "../application/service/graph/follow-service.js";
import { LikeService } from "../application/service/graph/like-service.js";
import { PostSearchService } from "../application/service/search/post-search-service.js";
import { ProfileSearchService } from "../application/service/search/profile-search-service.js";
import { InMemoryActorRepository } from "../infrastructure/actor-repository/actor-repository.in-memory.js";
import { InMemoryActorStatsRepository } from "../infrastructure/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryAssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.in-memory.js";
import { InMemoryAuthorFeedRepository } from "../infrastructure/author-feed-repository/author-feed-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/generator-repository/generator-repository.in-memory.js";
import { InMemoryInviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../infrastructure/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repost-repository/repost-repository.in-memory.js";
import { InMemorySubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.in-memory.js";
import { InMemoryTimelineRepository } from "../infrastructure/timeline-repository/timeline-repository.in-memory.js";

export const testInjector = createInjector()
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .provideValue("db", {} as never)
  .provideValue("publicUrl", "https://example.com")
  .provideClass("authorFeedRepository", InMemoryAuthorFeedRepository)
  .provideClass("postRepository", InMemoryPostRepository)
  .provideClass("postStatsRepository", InMemoryPostStatsRepository)
  .provideClass("profileRepository", InMemoryProfileRepository)
  .provideClass("followRepository", InMemoryFollowRepository)
  .provideClass("actorStatsRepository", InMemoryActorStatsRepository)
  .provideClass("recordRepository", InMemoryRecordRepository)
  .provideClass("repostRepository", InMemoryRepostRepository)
  .provideClass("likeRepository", InMemoryLikeRepository)
  .provideClass("generatorRepository", InMemoryGeneratorRepository)
  .provideClass("timelineRepository", InMemoryTimelineRepository)
  .provideClass("actorRepository", InMemoryActorRepository)
  .provideClass("subscriptionRepository", InMemorySubscriptionRepository)
  .provideClass("inviteCodeRepository", InMemoryInviteCodeRepository)
  .provideClass("transactionManager", InMemoryTransactionManager)
  .provideClass("assetUrlBuilder", InMemoryAssetUrlBuilder)
  .provideClass("profileViewBuilder", ProfileViewBuilder)
  .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("profileSearchService", ProfileSearchService)
  .provideClass("generatorViewService", GeneratorViewService)
  .provideClass("postViewService", PostViewService)
  .provideClass("replyRefService", ReplyRefService)
  .provideClass("feedProcessor", FeedProcessor)
  .provideClass("timelineService", TimelineService)
  .provideClass("searchService", PostSearchService)
  .provideClass("authorFeedService", AuthorFeedService)
  .provideClass("followService", FollowService)
  .provideClass("likeService", LikeService)
  .provideClass("actorLikesService", ActorLikesService)
  .provideClass("repostService", RepostService)
  .provideClass("subscriptionService", SubscriptionService)
  .provideClass("inviteCodeService", InviteCodeService);

export const setupFiles = () => {
  beforeEach(() => {
    testInjector.resolve("authorFeedRepository").clear();
    testInjector.resolve("postRepository").clear();
    testInjector.resolve("postStatsRepository").clear();
    testInjector.resolve("profileRepository").clear();
    testInjector.resolve("followRepository").clear();
    testInjector.resolve("actorStatsRepository").clear();
    testInjector.resolve("recordRepository").clear();
    testInjector.resolve("repostRepository").clear();
    testInjector.resolve("likeRepository").clear();
    testInjector.resolve("generatorRepository").clear();
    testInjector.resolve("timelineRepository").clear();
    testInjector.resolve("actorRepository").clear();
    testInjector.resolve("subscriptionRepository").clear();
    testInjector.resolve("inviteCodeRepository").clear();
  });
};
