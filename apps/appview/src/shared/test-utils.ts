import { createRegistry } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryJobQueue,
  InMemoryTransactionManager,
} from "@repo/common/test";
import { ac } from "@repo/common/utils";

import { ProfileViewBuilder } from "../application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "../application/service/actor/profile-view-service.js";
import { CreateAdminService } from "../application/service/admin/create-admin-service.js";
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
import { GetProfilesUseCase } from "../application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "../application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "../application/use-cases/actor/search-actors-use-case.js";
import { CreateInviteCodeUseCase } from "../application/use-cases/admin/create-invite-code-use-case.js";
import { DeleteInviteCodeUseCase } from "../application/use-cases/admin/delete-invite-code-use-case.js";
import { GetInviteCodesUseCase } from "../application/use-cases/admin/get-invite-codes-use-case.js";
import { GetSubscribersUseCase } from "../application/use-cases/admin/get-subscribers-use-case.js";
import { RegisterAdminUseCase } from "../application/use-cases/admin/register-admin-use-case.js";
import { VerifyAccessUseCase } from "../application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "../application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "../application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "../application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "../application/use-cases/feed/get-likes-use-case.js";
import { GetPostThreadUseCase } from "../application/use-cases/feed/get-post-thread-use-case.js";
import { GetRepostedByUseCase } from "../application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "../application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "../application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "../application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "../application/use-cases/graph/get-follows-use-case.js";
import { GetSetupStatusUseCase } from "../application/use-cases/server/get-setup-status-use-case.js";
import { GetSubscriptionStatusUseCase } from "../application/use-cases/sync/get-subscription-status-use-case.js";
import { SubscribeServerUseCase } from "../application/use-cases/sync/subscribe-server-use-case.js";
import { UnsubscribeServerUseCase } from "../application/use-cases/sync/unsubscribe-server-use-case.js";
import { AtUriService } from "../domain/service/at-uri-service.js";
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

// prettier-ignore
export const testRegistry = createRegistry()
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .value("db", {} as never)
  .value("publicUrl", "https://example.com")
  .service("authorFeedRepository", () => new InMemoryAuthorFeedRepository())
  .service("postRepository", () => new InMemoryPostRepository())
  .service("postStatsRepository", () => new InMemoryPostStatsRepository())
  .service("profileRepository", () => new InMemoryProfileRepository())
  .service("followRepository", () => new InMemoryFollowRepository())
  .service("actorStatsRepository", () => new InMemoryActorStatsRepository())
  .service("recordRepository", () => new InMemoryRecordRepository())
  .service("repostRepository", () => new InMemoryRepostRepository())
  .service("likeRepository", () => new InMemoryLikeRepository())
  .service("generatorRepository", () => new InMemoryGeneratorRepository())
  .service("timelineRepository", () => new InMemoryTimelineRepository())
  .service("actorRepository", () => new InMemoryActorRepository())
  .service("subscriptionRepository", () => new InMemorySubscriptionRepository())
  .service("inviteCodeRepository", () => new InMemoryInviteCodeRepository())
  .service("handleResolver", () => new InMemoryHandleResolver())
  .service("transactionManager", () => new InMemoryTransactionManager())
  .service("assetUrlBuilder", () => new InMemoryAssetUrlBuilder())
  .service("jobQueue", () => new InMemoryJobQueue())
  .service("jobScheduler", ["jobQueue"], ac(InMemoryJobScheduler))
  .service("createAdminService", ["actorRepository", "jobScheduler"], ac(CreateAdminService))
  .service("profileViewBuilder", ["assetUrlBuilder"], ac(ProfileViewBuilder))
  .service("postEmbedViewBuilder", ["assetUrlBuilder"], ac(PostEmbedViewBuilder))
  .service("profileSearchService", ["profileRepository"], ac(ProfileSearchService))
  .service("profileViewService", ["profileRepository", "actorStatsRepository", "followRepository", "profileViewBuilder"], ac(ProfileViewService))
  .service("generatorViewService", ["generatorRepository", "profileViewService", "assetUrlBuilder"], ac(GeneratorViewService))
  .service("postViewService", ["postRepository", "postStatsRepository", "recordRepository", "profileViewService", "generatorViewService", "postEmbedViewBuilder", "repostRepository", "likeRepository"], ac(PostViewService))
  .service("replyRefService", ["postViewService"], ac(ReplyRefService))
  .service("feedProcessor", ["postRepository", "repostRepository", "postViewService", "profileViewService", "replyRefService"], ac(FeedProcessor))
  .service("timelineService", ["timelineRepository"], ac(TimelineService))
  .service("searchService", ["postRepository"], ac(PostSearchService))
  .service("authorFeedService", ["authorFeedRepository"], ac(AuthorFeedService))
  .service("followService", ["followRepository"], ac(FollowService))
  .service("likeService", ["likeRepository"], ac(LikeService))
  .service("actorLikesService", ["likeRepository"], ac(ActorLikesService))
  .service("repostService", ["repostRepository"], ac(RepostService))
  .service("inviteCodeService", ["inviteCodeRepository"], ac(InviteCodeService))
  .service("subscriptionService", ["subscriptionRepository"], ac(SubscriptionService))
  .service("atUriService", ["handleResolver"], ac(AtUriService))
  // use-cases
  .service("getProfilesUseCase", ["profileViewService"], ac(GetProfilesUseCase))
  .service("searchActorsUseCase", ["profileSearchService", "profileViewService"], ac(SearchActorsUseCase))
  .service("searchActorsTypeaheadUseCase", ["profileSearchService", "profileViewService"], ac(SearchActorsTypeaheadUseCase))
  .service("getActorLikesUseCase", ["actorLikesService", "feedProcessor"], ac(GetActorLikesUseCase))
  .service("getAuthorFeedUseCase", ["authorFeedService", "feedProcessor"], ac(GetAuthorFeedUseCase))
  .service("getFeedGeneratorsUseCase", ["generatorViewService"], ac(GetFeedGeneratorsUseCase))
  .service("getLikesUseCase", ["likeService", "profileViewService"], ac(GetLikesUseCase))
  .service("getPostThreadUseCase", ["postRepository", "postViewService"], ac(GetPostThreadUseCase))
  .service("getRepostedByUseCase", ["repostService", "profileViewService"], ac(GetRepostedByUseCase))
  .service("getTimelineUseCase", ["timelineService", "feedProcessor"], ac(GetTimelineUseCase))
  .service("searchPostsUseCase", ["searchService", "postViewService"], ac(SearchPostsUseCase))
  .service("getFollowsUseCase", ["followService", "profileViewService"], ac(GetFollowsUseCase))
  .service("getFollowersUseCase", ["followService", "profileViewService"], ac(GetFollowersUseCase))
  .service("createInviteCodeUseCase", ["db", "inviteCodeRepository", "publicUrl"], ac(CreateInviteCodeUseCase))
  .service("deleteInviteCodeUseCase", ["db", "inviteCodeRepository"], ac(DeleteInviteCodeUseCase))
  .service("getInviteCodesUseCase", ["inviteCodeService"], ac(GetInviteCodesUseCase))
  .service("getSubscribersUseCase", ["subscriptionService", "profileViewService"], ac(GetSubscribersUseCase))
  .service("registerAdminUseCase", ["transactionManager", "actorRepository", "subscriptionRepository", "createAdminService", "jobScheduler"], ac(RegisterAdminUseCase))
  .service("verifyAccessUseCase", ["actorRepository"], ac(VerifyAccessUseCase))
  .service("getSetupStatusUseCase", ["actorRepository"], ac(GetSetupStatusUseCase))
  .service("getSubscriptionStatusUseCase", ["subscriptionRepository"], ac(GetSubscriptionStatusUseCase))
  .service("subscribeServerUseCase", ["transactionManager", "actorRepository", "inviteCodeRepository", "subscriptionRepository", "jobScheduler"], ac(SubscribeServerUseCase))
  .service("unsubscribeServerUseCase", ["subscriptionRepository"], ac(UnsubscribeServerUseCase), );

export type TestServices = Awaited<ReturnType<typeof testRegistry.resolve>>;
