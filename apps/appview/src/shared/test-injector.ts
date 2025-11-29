import { createInjector } from "typed-inject";

import { ProfileViewBuilder } from "../application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "../application/service/actor/profile-view-service.js";
import { ActorLikesService } from "../application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "../application/service/feed/author-feed-service.js";
import { FeedProcessor } from "../application/service/feed/feed-processor.js";
import { GeneratorViewService } from "../application/service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "../application/service/feed/post-embed-view-builder.js";
import { PostViewService } from "../application/service/feed/post-view-service.js";
import { ReplyRefService } from "../application/service/feed/reply-ref-service.js";
import { RepostService } from "../application/service/feed/repost-service.js";
import { LikeService } from "../application/service/graph/like-service.js";
import { ProfileSearchService } from "../application/service/search/profile-search-service.js";
import { InMemoryActorStatsRepository } from "../infrastructure/actor-stats-repository/actor-stats-repository.in-memory.js";
import { InMemoryAssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.in-memory.js";
import { InMemoryAuthorFeedRepository } from "../infrastructure/author-feed-repository/author-feed-repository.in-memory.js";
import { InMemoryFollowRepository } from "../infrastructure/follow-repository/follow-repository.in-memory.js";
import { InMemoryGeneratorRepository } from "../infrastructure/generator-repository/generator-repository.in-memory.js";
import { InMemoryLikeRepository } from "../infrastructure/like-repository/like-repository.in-memory.js";
import { InMemoryPostRepository } from "../infrastructure/post-repository/post-repository.in-memory.js";
import { InMemoryPostStatsRepository } from "../infrastructure/post-stats-repository/post-stats-repository.in-memory.js";
import { InMemoryProfileRepository } from "../infrastructure/profile-repository/profile-repository.in-memory.js";
import { InMemoryRecordRepository } from "../infrastructure/record-repository/record-repository.in-memory.js";
import { InMemoryRepostRepository } from "../infrastructure/repost-repository/repost-repository.in-memory.js";
import { InMemoryTimelineRepository } from "../infrastructure/timeline-repository/timeline-repository.in-memory.js";

export const testInjector = createInjector()
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
  .provideClass("assetUrlBuilder", InMemoryAssetUrlBuilder)
  .provideClass("profileViewBuilder", ProfileViewBuilder)
  .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("profileSearchService", ProfileSearchService)
  .provideClass("generatorViewService", GeneratorViewService)
  .provideClass("postViewService", PostViewService)
  .provideClass("replyRefService", ReplyRefService)
  .provideClass("feedProcessor", FeedProcessor)
  .provideClass("authorFeedService", AuthorFeedService)
  .provideClass("likeService", LikeService)
  .provideClass("actorLikesService", ActorLikesService)
  .provideClass("repostService", RepostService);
