import {
  asClass,
  asClassArgs,
  asFunctionArgs,
  createRegistry,
} from "@gyaku/di";
import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  HandleResolver as AtprotoHandleResolver,
  JobQueue,
  JobScheduler,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TransactionManager,
} from "@repo/common/infrastructure";
import type {
  IDidCache,
  IDidResolver,
  IHandleResolver as IAtprotoHandleResolver,
  IJobQueue,
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { IAccountRepository } from "../application/interfaces/account-repository.js";
import type { IAssetUrlBuilder } from "../application/interfaces/asset-url-builder.js";
import type { IHandleResolver } from "../application/interfaces/handle-resolver.js";
import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";
import type { IAccountQuery } from "../application/interfaces/queries/account-query.js";
import type { IAccountStatsQuery } from "../application/interfaces/queries/account-stats-query.js";
import type { IAuthorFeedQuery } from "../application/interfaces/queries/author-feed-query.js";
import type { IFollowQuery } from "../application/interfaces/queries/follow-query.js";
import type { IGeneratorQuery } from "../application/interfaces/queries/generator-query.js";
import type { IInviteCodeQuery } from "../application/interfaces/queries/invite-code-query.js";
import type { ILabelQuery } from "../application/interfaces/queries/label-query.js";
import type { ILikeQuery } from "../application/interfaces/queries/like-query.js";
import type { IListItemQuery } from "../application/interfaces/queries/list-item-query.js";
import type { IListQuery } from "../application/interfaces/queries/list-query.js";
import type { INotificationQuery } from "../application/interfaces/queries/notification-query.js";
import type { IPostQuery } from "../application/interfaces/queries/post-query.js";
import type { IPostStatsQuery } from "../application/interfaces/queries/post-stats-query.js";
import type { IProfileQuery } from "../application/interfaces/queries/profile-query.js";
import type { IRecordQuery } from "../application/interfaces/queries/record-query.js";
import type { IRegistrationQuery } from "../application/interfaces/queries/registration-query.js";
import type { IRepostQuery } from "../application/interfaces/queries/repost-query.js";
import type { ITimelineQuery } from "../application/interfaces/queries/timeline-query.js";
import type { ITrackingQuery } from "../application/interfaces/queries/tracking-query.js";
import type { IRegistrationRepository } from "../application/interfaces/registration-repository.js";
import type { ITokenVerifier } from "../application/interfaces/token-verifier.js";
import { CreateAdminService } from "../application/service/admin/create-admin-service.js";
import { AtUriService } from "../application/service/at-uri-service.js";
import { PostThreadService } from "../application/service/feed/post-thread-service.js";
import { CreateRegistrationService } from "../application/service/sync/create-registration-service.js";
import { UnregisterAccountService } from "../application/service/sync/unregister-account-service.js";
import { ValidateRegistrationService } from "../application/service/sync/validate-registration-service.js";
import { GetProfileUseCase } from "../application/use-cases/actor/get-profile-use-case.js";
import { GetProfilesUseCase } from "../application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "../application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "../application/use-cases/actor/search-actors-use-case.js";
import { AddMemberUseCase } from "../application/use-cases/admin/add-member-use-case.js";
import { CreateInviteCodeUseCase } from "../application/use-cases/admin/create-invite-code-use-case.js";
import { DeleteInviteCodeUseCase } from "../application/use-cases/admin/delete-invite-code-use-case.js";
import { GetInviteCodesUseCase } from "../application/use-cases/admin/get-invite-codes-use-case.js";
import { GrantAdminUseCase } from "../application/use-cases/admin/grant-admin-use-case.js";
import { ListServerMembersUseCase } from "../application/use-cases/admin/list-server-members-use-case.js";
import { RegisterAdminUseCase } from "../application/use-cases/admin/register-admin-use-case.js";
import { RemoveMemberUseCase } from "../application/use-cases/admin/remove-member-use-case.js";
import { RevokeAdminUseCase } from "../application/use-cases/admin/revoke-admin-use-case.js";
import { VerifyAccessUseCase } from "../application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "../application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "../application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "../application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "../application/use-cases/feed/get-likes-use-case.js";
import { GetListFeedUseCase } from "../application/use-cases/feed/get-list-feed-use-case.js";
import { GetLocalTimelineUseCase } from "../application/use-cases/feed/get-local-timeline-use-case.js";
import { GetPostThreadUseCase } from "../application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostThreadV2UseCase } from "../application/use-cases/feed/get-post-thread-v2-use-case.js";
import { GetPostsUseCase } from "../application/use-cases/feed/get-posts-use-case.js";
import { GetQuotesUseCase } from "../application/use-cases/feed/get-quotes-use-case.js";
import { GetRepostedByUseCase } from "../application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "../application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "../application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "../application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "../application/use-cases/graph/get-follows-use-case.js";
import { GetKnownFollowersUseCase } from "../application/use-cases/graph/get-known-followers-use-case.js";
import { GetListUseCase } from "../application/use-cases/graph/get-list-use-case.js";
import { GetListsUseCase } from "../application/use-cases/graph/get-lists-use-case.js";
import { GetListsWithMembershipUseCase } from "../application/use-cases/graph/get-lists-with-membership-use-case.js";
import { GetServerMemberFollowersUseCase } from "../application/use-cases/graph/get-server-member-followers-use-case.js";
import { GetGroupedNotificationsUseCase } from "../application/use-cases/notification/get-grouped-notifications-use-case.js";
import { GetUnreadCountUseCase } from "../application/use-cases/notification/get-unread-count-use-case.js";
import { ListNotificationsUseCase } from "../application/use-cases/notification/list-notifications-use-case.js";
import { UpdateSeenUseCase } from "../application/use-cases/notification/update-seen-use-case.js";
import { GetFollowedAccountsUseCase } from "../application/use-cases/server/get-followed-accounts-use-case.js";
import { GetOperatorUseCase } from "../application/use-cases/server/get-operator-use-case.js";
import { GetServerMembersUseCase } from "../application/use-cases/server/get-server-members-use-case.js";
import { GetSetupStatusUseCase } from "../application/use-cases/server/get-setup-status-use-case.js";
import { GetRegistrationStatusUseCase } from "../application/use-cases/sync/get-registration-status-use-case.js";
import { GetTrackingStatusesUseCase } from "../application/use-cases/sync/get-tracking-statuses-use-case.js";
import { RegisterAccountUseCase } from "../application/use-cases/sync/register-account-use-case.js";
import { UnregisterAccountUseCase } from "../application/use-cases/sync/unregister-account-use-case.js";
import { EmbedViews } from "../application/views/embed-views.js";
import { FeedViews } from "../application/views/feed-views.js";
import { GeneratorViews } from "../application/views/generator-views.js";
import { ListViews } from "../application/views/list-views.js";
import { NotificationViews } from "../application/views/notification-views.js";
import { PostViews } from "../application/views/post-views.js";
import { ProfileViews } from "../application/views/profile-views.js";
import { ViewContextFactory } from "../application/views/view-context.js";
import { AccountRepository } from "../infrastructure/account-repository/account-repository.js";
import { AssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.js";
import { HandleResolver } from "../infrastructure/handle-resolver/handle-resolver.js";
import { InviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.js";
import { AccountQuery } from "../infrastructure/queries/account-query/account-query.js";
import { AccountStatsQuery } from "../infrastructure/queries/account-stats-query/account-stats-query.js";
import { AuthorFeedQuery } from "../infrastructure/queries/author-feed-query/author-feed-query.js";
import { FollowQuery } from "../infrastructure/queries/follow-query/follow-query.js";
import { GeneratorQuery } from "../infrastructure/queries/generator-query/generator-query.js";
import { InviteCodeQuery } from "../infrastructure/queries/invite-code-query/invite-code-query.js";
import { LabelQuery } from "../infrastructure/queries/label-query/label-query.js";
import { LikeQuery } from "../infrastructure/queries/like-query/like-query.js";
import { ListItemQuery } from "../infrastructure/queries/list-item-query/list-item-query.js";
import { ListQuery } from "../infrastructure/queries/list-query/list-query.js";
import { NotificationQuery } from "../infrastructure/queries/notification-query/notification-query.js";
import { PostQuery } from "../infrastructure/queries/post-query/post-query.js";
import { PostStatsQuery } from "../infrastructure/queries/post-stats-query/post-stats-query.js";
import { ProfileQuery } from "../infrastructure/queries/profile-query/profile-query.js";
import { RecordQuery } from "../infrastructure/queries/record-query/record-query.js";
import { RegistrationQuery } from "../infrastructure/queries/registration-query/registration-query.js";
import { RepostQuery } from "../infrastructure/queries/repost-query/repost-query.js";
import { TimelineQuery } from "../infrastructure/queries/timeline-query/timeline-query.js";
import { TrackingQuery } from "../infrastructure/queries/tracking-query/tracking-query.js";
import { RegistrationRepository } from "../infrastructure/registration-repository/registration-repository.js";
import { TokenVerifier } from "../infrastructure/token-verifier/token-verifier.js";
import { AdminMiddleware } from "../presentation/middleware/admin-middleware.js";
import { AuthVerifierMiddleware } from "../presentation/middleware/auth-verifier-middleware.js";
import { HandleMiddleware } from "../presentation/middleware/handle-middleware.js";
import { RepoRevMiddleware } from "../presentation/middleware/repo-rev-middleware.js";
import { GetPreferences } from "../presentation/routes/app/bsky/actor/getPreferences.js";
import { GetProfile } from "../presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "../presentation/routes/app/bsky/actor/getProfiles.js";
import { SearchActors } from "../presentation/routes/app/bsky/actor/searchActors.js";
import { SearchActorsTypeahead } from "../presentation/routes/app/bsky/actor/searchActorsTypeahead.js";
import { GetActorLikes } from "../presentation/routes/app/bsky/feed/getActorLikes.js";
import { GetAuthorFeed } from "../presentation/routes/app/bsky/feed/getAuthorFeed.js";
import { GetFeedGenerators } from "../presentation/routes/app/bsky/feed/getFeedGenerators.js";
import { GetLikes } from "../presentation/routes/app/bsky/feed/getLikes.js";
import { GetListFeed } from "../presentation/routes/app/bsky/feed/getListFeed.js";
import { GetPosts } from "../presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "../presentation/routes/app/bsky/feed/getPostThread.js";
import { GetQuotes } from "../presentation/routes/app/bsky/feed/getQuotes.js";
import { GetRepostedBy } from "../presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "../presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "../presentation/routes/app/bsky/feed/searchPosts.js";
import { SearchPostsV2 } from "../presentation/routes/app/bsky/feed/searchPostsV2.js";
import { GetFollowers } from "../presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "../presentation/routes/app/bsky/graph/getFollows.js";
import { GetKnownFollowers } from "../presentation/routes/app/bsky/graph/getKnownFollowers.js";
import { GetList } from "../presentation/routes/app/bsky/graph/getList.js";
import { GetLists } from "../presentation/routes/app/bsky/graph/getLists.js";
import { GetListsWithMembership } from "../presentation/routes/app/bsky/graph/getListsWithMembership.js";
import { GetGroupedNotifications } from "../presentation/routes/app/bsky/notification/getGroupedNotifications.js";
import { GetUnreadCount } from "../presentation/routes/app/bsky/notification/getUnreadCount.js";
import { ListNotifications } from "../presentation/routes/app/bsky/notification/listNotifications.js";
import { UpdateSeen } from "../presentation/routes/app/bsky/notification/updateSeen.js";
import { GetPostThreadV2 } from "../presentation/routes/app/bsky/unspecced/getPostThreadV2.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { lexRouterFactory } from "../presentation/routes/lex.js";
import { AddMember } from "../presentation/routes/me/subsco/admin/addMember.js";
import { CreateInviteCode } from "../presentation/routes/me/subsco/admin/createInviteCode.js";
import { DeleteInviteCode } from "../presentation/routes/me/subsco/admin/deleteInviteCode.js";
import { GetInviteCodes } from "../presentation/routes/me/subsco/admin/getInviteCodes.js";
import { GrantAdmin } from "../presentation/routes/me/subsco/admin/grantAdmin.js";
import { ListServerMembers } from "../presentation/routes/me/subsco/admin/listServerMembers.js";
import { RegisterAdmin } from "../presentation/routes/me/subsco/admin/registerAdmin.js";
import { RemoveMember } from "../presentation/routes/me/subsco/admin/removeMember.js";
import { RevokeAdmin } from "../presentation/routes/me/subsco/admin/revokeAdmin.js";
import { VerifyAccess } from "../presentation/routes/me/subsco/admin/verifyAccess.js";
import { GetServerMemberFollowers } from "../presentation/routes/me/subsco/graph/getServerMemberFollowers.js";
import { GetFollowedAccounts } from "../presentation/routes/me/subsco/server/getFollowedAccounts.js";
import { GetLocalTimeline } from "../presentation/routes/me/subsco/server/getLocalTimeline.js";
import { GetOperator } from "../presentation/routes/me/subsco/server/getOperator.js";
import { GetServerMembers } from "../presentation/routes/me/subsco/server/getServerMembers.js";
import { GetSetupStatus } from "../presentation/routes/me/subsco/server/getSetupStatus.js";
import { GetRegistrationStatus } from "../presentation/routes/me/subsco/sync/getRegistrationStatus.js";
import { GetTrackingStatuses } from "../presentation/routes/me/subsco/sync/getTrackingStatuses.js";
import { RegisterAccount } from "../presentation/routes/me/subsco/sync/registerAccount.js";
import { UnregisterAccount } from "../presentation/routes/me/subsco/sync/unregisterAccount.js";
import { wellKnownRouterFactory } from "../presentation/routes/well-known.js";
import { AppViewServer } from "../presentation/server.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createAppRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("env", env)
    // infrastructure
    .service("loggerManager", ["env"], asClassArgs(LoggerManager))
    .service("metricReporter", asClassArgs(MetricReporter))
    .service("connectionPool", ["env"], connectionPoolFactory)
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>()(TransactionManager))
    .service("didCache", ["env", "metricReporter"], asClassArgs<IDidCache>()(RedisDidCache))
    .service("didResolver", ["env", "loggerManager", "didCache", "metricReporter"], asClass<IDidResolver>()(DidResolver))
    .service("jobQueue", ["env"], asClassArgs<IJobQueue>()(JobQueue))
    .service("profileQuery", ["db"], asClassArgs<IProfileQuery>()(ProfileQuery))
    .service("labelQuery", ["db"], asClassArgs<ILabelQuery>()(LabelQuery))
    .service("accountRepository", ["db"], asClassArgs<IAccountRepository>()(AccountRepository))
    .service("accountQuery", ["db"], asClassArgs<IAccountQuery>()(AccountQuery))
    .service("accountStatsQuery", ["db"], asClassArgs<IAccountStatsQuery>()(AccountStatsQuery))
    .service("handleResolver", ["db"], asClassArgs<IHandleResolver>()(HandleResolver))
    .service("atprotoHandleResolver", ["env"], asClassArgs<IAtprotoHandleResolver>()(AtprotoHandleResolver))
    .service("recordQuery", ["db"], asClassArgs<IRecordQuery>()(RecordQuery))
    .service("notificationQuery", ["db"], asClassArgs<INotificationQuery>()(NotificationQuery))
    .service("generatorQuery", ["db"], asClassArgs<IGeneratorQuery>()(GeneratorQuery))
    .service("likeQuery", ["db"], asClassArgs<ILikeQuery>()(LikeQuery))
    .service("postQuery", ["db"], asClassArgs<IPostQuery>()(PostQuery))
    .service("postStatsQuery", ["db"], asClassArgs<IPostStatsQuery>()(PostStatsQuery))
    .service("timelineQuery", ["db"], asClassArgs<ITimelineQuery>()(TimelineQuery))
    .service("authorFeedQuery", ["db"], asClassArgs<IAuthorFeedQuery>()(AuthorFeedQuery))
    .service("repostQuery", ["db"], asClassArgs<IRepostQuery>()(RepostQuery))
    .service("followQuery", ["db"], asClassArgs<IFollowQuery>()(FollowQuery))
    .service("listItemQuery", ["db"], asClassArgs<IListItemQuery>()(ListItemQuery))
    .service("listQuery", ["db"], asClassArgs<IListQuery>()(ListQuery))
    .service("inviteCodeQuery", ["db"], asClassArgs<IInviteCodeQuery>()(InviteCodeQuery))
    .service("inviteCodeRepository", ["db"], asClassArgs<IInviteCodeRepository>()(InviteCodeRepository))
    .service("registrationQuery", ["db"], asClassArgs<IRegistrationQuery>()(RegistrationQuery))
    .service("trackingQuery", ["db"], asClassArgs<ITrackingQuery>()(TrackingQuery))
    .service("registrationRepository", ["db"], asClassArgs<IRegistrationRepository>()(RegistrationRepository))
    .service("tokenVerifier", ["didResolver", "env"], asClassArgs<ITokenVerifier>()(TokenVerifier))
    .service("assetUrlBuilder", ["env"], asClassArgs<IAssetUrlBuilder>()(AssetUrlBuilder))
    // application
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>()(JobScheduler))
    .service("createAdminService", ["accountRepository", "jobScheduler"], asClassArgs(CreateAdminService))
    .service("validateRegistrationService", ["accountRepository", "registrationRepository"], asClassArgs(ValidateRegistrationService))
    .service("createRegistrationService", ["registrationRepository", "followQuery", "jobScheduler"], asClassArgs(CreateRegistrationService))
    .service("unregisterAccountService", ["registrationRepository", "followQuery", "jobScheduler"], asClassArgs(UnregisterAccountService))
    .service("authVerifierMiddleware", ["tokenVerifier"], asClassArgs(AuthVerifierMiddleware))
    .service("adminMiddleware", ["authVerifierMiddleware", "accountRepository"], asClassArgs(AdminMiddleware))
    .service("atUriService", ["handleResolver"], asClassArgs(AtUriService))
    .service("repoRevMiddleware", ["accountQuery"], asClassArgs(RepoRevMiddleware))
    .service("handleMiddleware", ["handleResolver", "loggerManager"], asClassArgs(HandleMiddleware))
    .service("viewContextFactory", ["profileQuery", "labelQuery", "followQuery", "postQuery", "recordQuery", "postStatsQuery", "likeQuery", "repostQuery", "generatorQuery", "accountStatsQuery", "listQuery", "listItemQuery"], asClass(ViewContextFactory))
    .service("profileViews", ["assetUrlBuilder"], asClassArgs(ProfileViews))
    .service("generatorViews", ["profileViews", "assetUrlBuilder"], asClassArgs(GeneratorViews))
    .service("embedViews", ["profileViews", "generatorViews", "assetUrlBuilder"], asClass(EmbedViews))
    .service("listViews", ["profileViews", "assetUrlBuilder"], asClassArgs(ListViews))
    .service("postViews", ["profileViews", "embedViews", "listViews"], asClass(PostViews))
    .service("feedViews", ["postViews", "profileViews"], asClassArgs(FeedViews))
    .service("notificationViews", ["profileViews", "postViews", "generatorViews"], asClass(NotificationViews))
    // use-cases
    .service("getProfileUseCase", ["viewContextFactory", "profileViews"], asClassArgs(GetProfileUseCase))
    .service("getProfilesUseCase", ["viewContextFactory", "profileViews"], asClassArgs(GetProfilesUseCase))
    .service("searchActorsUseCase", ["profileQuery", "viewContextFactory", "profileViews"], asClassArgs(SearchActorsUseCase))
    .service("searchActorsTypeaheadUseCase", ["profileQuery", "viewContextFactory", "profileViews"], asClassArgs(SearchActorsTypeaheadUseCase))
    .service("getPostsUseCase", ["viewContextFactory", "postViews"], asClassArgs(GetPostsUseCase))
    .service("postThreadService", ["postQuery", "viewContextFactory", "postViews"], asClass(PostThreadService))
    .service("getPostThreadUseCase", ["postThreadService"], asClassArgs(GetPostThreadUseCase))
    .service("getPostThreadV2UseCase", ["postThreadService"], asClassArgs(GetPostThreadV2UseCase))
    .service("getTimelineUseCase", ["timelineQuery", "viewContextFactory", "feedViews"], asClassArgs(GetTimelineUseCase))
    .service("listNotificationsUseCase", ["notificationQuery", "registrationRepository", "viewContextFactory", "profileViews"], asClassArgs(ListNotificationsUseCase))
    .service("searchPostsUseCase", ["postQuery", "viewContextFactory", "postViews"], asClassArgs(SearchPostsUseCase))
    .service("getActorLikesUseCase", ["likeQuery", "viewContextFactory", "feedViews"], asClassArgs(GetActorLikesUseCase))
    .service("getAuthorFeedUseCase", ["authorFeedQuery", "viewContextFactory", "feedViews", "profileViews"], asClassArgs(GetAuthorFeedUseCase))
    .service("getFeedGeneratorsUseCase", ["viewContextFactory", "generatorViews"], asClassArgs(GetFeedGeneratorsUseCase))
    .service("getLikesUseCase", ["likeQuery", "viewContextFactory", "profileViews"], asClassArgs(GetLikesUseCase))
    .service("getLocalTimelineUseCase", ["timelineQuery", "viewContextFactory", "feedViews"], asClassArgs(GetLocalTimelineUseCase))
    .service("getListFeedUseCase", ["timelineQuery", "viewContextFactory", "feedViews"], asClassArgs(GetListFeedUseCase))
    .service("getQuotesUseCase", ["postQuery", "viewContextFactory", "postViews"], asClassArgs(GetQuotesUseCase))
    .service("getRepostedByUseCase", ["repostQuery", "viewContextFactory", "profileViews"], asClassArgs(GetRepostedByUseCase))
    .service("getFollowsUseCase", ["followQuery", "viewContextFactory", "profileViews"], asClassArgs(GetFollowsUseCase))
    .service("getKnownFollowersUseCase", ["followQuery", "viewContextFactory", "profileViews"], asClassArgs(GetKnownFollowersUseCase))
    .service("getFollowersUseCase", ["followQuery", "viewContextFactory", "profileViews"], asClassArgs(GetFollowersUseCase))
    .service("getListUseCase", ["listQuery", "viewContextFactory", "listViews", "profileViews"], asClassArgs(GetListUseCase))
    .service("getListsWithMembershipUseCase", ["listQuery", "viewContextFactory", "listViews", "profileViews"], asClassArgs(GetListsWithMembershipUseCase))
    .service("getListsUseCase", ["listQuery", "viewContextFactory", "listViews"], asClassArgs(GetListsUseCase))
    .service("createInviteCodeUseCase", ["transactionManager", "inviteCodeRepository", "env"], asClass(CreateInviteCodeUseCase))
    .service("deleteInviteCodeUseCase", ["transactionManager", "inviteCodeRepository"], asClassArgs(DeleteInviteCodeUseCase))
    .service("getInviteCodesUseCase", ["inviteCodeQuery", "viewContextFactory", "profileViews"], asClass(GetInviteCodesUseCase))
    .service("listServerMembersUseCase", ["viewContextFactory", "profileViews", "accountRepository", "registrationQuery"], asClassArgs(ListServerMembersUseCase))
    .service("grantAdminUseCase", ["transactionManager", "accountRepository", "registrationRepository"], asClass(GrantAdminUseCase))
    .service("revokeAdminUseCase", ["transactionManager", "accountRepository"], asClassArgs(RevokeAdminUseCase))
    .service("registerAdminUseCase", ["transactionManager", "accountQuery", "createAdminService", "createRegistrationService"], asClassArgs(RegisterAdminUseCase))
    .service("verifyAccessUseCase", ["accountRepository"], asClassArgs(VerifyAccessUseCase))
    .service("getServerMembersUseCase", ["registrationQuery", "accountRepository", "viewContextFactory", "profileViews"], asClassArgs(GetServerMembersUseCase))
    .service("getOperatorUseCase", ["registrationQuery", "viewContextFactory", "profileViews"], asClassArgs(GetOperatorUseCase))
    .service("getSetupStatusUseCase", ["accountQuery"], asClassArgs(GetSetupStatusUseCase))
    .service("getServerMemberFollowersUseCase", ["registrationQuery", "viewContextFactory", "profileViews"], asClassArgs(GetServerMemberFollowersUseCase))
    .service("getFollowedAccountsUseCase", ["registrationQuery", "viewContextFactory", "profileViews"], asClassArgs(GetFollowedAccountsUseCase))
    .service("getTrackingStatusesUseCase", ["trackingQuery"], asClassArgs(GetTrackingStatusesUseCase))
    .service("getRegistrationStatusUseCase", ["registrationRepository"], asClassArgs(GetRegistrationStatusUseCase))
    .service("registerAccountUseCase", ["transactionManager", "accountRepository", "inviteCodeRepository", "validateRegistrationService", "createRegistrationService"], asClassArgs(RegisterAccountUseCase))
    .service("addMemberUseCase", ["atprotoHandleResolver", "didResolver", "transactionManager", "accountRepository", "validateRegistrationService", "createRegistrationService"], asClass(AddMemberUseCase))
    .service("unregisterAccountUseCase", ["transactionManager", "unregisterAccountService"], asClassArgs(UnregisterAccountUseCase))
    .service("removeMemberUseCase", ["transactionManager", "accountRepository", "unregisterAccountService"], asClassArgs(RemoveMemberUseCase))
    .service("updateSeenUseCase", ["transactionManager", "registrationRepository"], asClassArgs(UpdateSeenUseCase))
    // presentation
    .service("getPreferences", asClassArgs(GetPreferences))
    .service("getProfile", ["getProfileUseCase", "handleMiddleware", "authVerifierMiddleware", "repoRevMiddleware"], asClassArgs(GetProfile))
    .service("getProfiles", ["getProfilesUseCase", "handleMiddleware", "authVerifierMiddleware", "repoRevMiddleware"], asClassArgs(GetProfiles))
    .service("searchActors", ["authVerifierMiddleware", "searchActorsUseCase"], asClassArgs(SearchActors))
    .service("searchActorsTypeahead", ["authVerifierMiddleware", "searchActorsTypeaheadUseCase"], asClassArgs(SearchActorsTypeahead))
    .service("getPosts", ["getPostsUseCase", "authVerifierMiddleware"], asClassArgs(GetPosts))
    .service("getPostThread", ["getPostThreadUseCase", "atUriService", "authVerifierMiddleware", "repoRevMiddleware"], asClassArgs(GetPostThread))
    .service("getPostThreadV2", ["getPostThreadV2UseCase", "atUriService", "authVerifierMiddleware"], asClassArgs(GetPostThreadV2))
    .service("getTimeline", ["authVerifierMiddleware", "getTimelineUseCase", "repoRevMiddleware"], asClassArgs(GetTimeline))
    .service("listNotifications", ["authVerifierMiddleware", "listNotificationsUseCase"], asClassArgs(ListNotifications))
    .service("getGroupedNotificationsUseCase", ["notificationQuery", "registrationRepository", "viewContextFactory", "notificationViews"], asClassArgs(GetGroupedNotificationsUseCase))
    .service("getGroupedNotifications", ["authVerifierMiddleware", "getGroupedNotificationsUseCase"], asClassArgs(GetGroupedNotifications))
    .service("getUnreadCountUseCase", ["notificationQuery"], asClassArgs(GetUnreadCountUseCase))
    .service("getUnreadCount", ["authVerifierMiddleware", "getUnreadCountUseCase"], asClassArgs(GetUnreadCount))
    .service("searchPosts", ["searchPostsUseCase", "authVerifierMiddleware"], asClassArgs(SearchPosts))
    .service("searchPostsV2", ["searchPostsUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(SearchPostsV2))
    .service("getActorLikes", ["getActorLikesUseCase", "handleMiddleware", "authVerifierMiddleware", "repoRevMiddleware"], asClassArgs(GetActorLikes))
    .service("getAuthorFeed", ["getAuthorFeedUseCase", "handleMiddleware", "authVerifierMiddleware", "repoRevMiddleware"], asClassArgs(GetAuthorFeed))
    .service("getFeedGenerators", ["getFeedGeneratorsUseCase", "authVerifierMiddleware"], asClassArgs(GetFeedGenerators))
    .service("getLikes", ["getLikesUseCase", "authVerifierMiddleware"], asClassArgs(GetLikes))
    .service("getListFeed", ["authVerifierMiddleware", "getListFeedUseCase", "repoRevMiddleware"], asClassArgs(GetListFeed))
    .service("getQuotes", ["getQuotesUseCase", "authVerifierMiddleware"], asClassArgs(GetQuotes))
    .service("getRepostedBy", ["getRepostedByUseCase", "authVerifierMiddleware"], asClassArgs(GetRepostedBy))
    .service("getFollows", ["getFollowsUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetFollows))
    .service("getKnownFollowers", ["authVerifierMiddleware", "getKnownFollowersUseCase", "handleMiddleware"], asClassArgs(GetKnownFollowers))
    .service("getFollowers", ["getFollowersUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetFollowers))
    .service("getList", ["getListUseCase", "atUriService", "authVerifierMiddleware"], asClassArgs(GetList))
    .service("getListsWithMembership", ["authVerifierMiddleware", "getListsWithMembershipUseCase", "handleMiddleware"], asClassArgs(GetListsWithMembership))
    .service("getLists", ["getListsUseCase", "handleMiddleware"], asClassArgs(GetLists))
    .service("createInviteCode", ["createInviteCodeUseCase", "adminMiddleware"], asClassArgs(CreateInviteCode))
    .service("deleteInviteCode", ["deleteInviteCodeUseCase", "adminMiddleware"], asClassArgs(DeleteInviteCode))
    .service("getInviteCodes", ["getInviteCodesUseCase", "adminMiddleware"], asClassArgs(GetInviteCodes))
    .service("listServerMembers", ["listServerMembersUseCase", "adminMiddleware"], asClassArgs(ListServerMembers))
    .service("grantAdmin", ["grantAdminUseCase", "adminMiddleware"], asClassArgs(GrantAdmin))
    .service("addMember", ["addMemberUseCase", "adminMiddleware"], asClassArgs(AddMember))
    .service("revokeAdmin", ["revokeAdminUseCase", "adminMiddleware"], asClassArgs(RevokeAdmin))
    .service("registerAdmin", ["registerAdminUseCase", "authVerifierMiddleware"], asClassArgs(RegisterAdmin))
    .service("verifyAccess", ["verifyAccessUseCase", "authVerifierMiddleware"], asClassArgs(VerifyAccess))
    .service("getLocalTimeline", ["authVerifierMiddleware", "getLocalTimelineUseCase"], asClassArgs(GetLocalTimeline))
    .service("getServerMembers", ["getServerMembersUseCase"], asClassArgs(GetServerMembers))
    .service("getSetupStatus", ["getSetupStatusUseCase"], asClassArgs(GetSetupStatus))
    .service("getOperator", ["getOperatorUseCase"], asClassArgs(GetOperator))
    .service("getServerMemberFollowers", ["getServerMemberFollowersUseCase", "handleMiddleware"], asClassArgs(GetServerMemberFollowers))
    .service("getFollowedAccounts", ["getFollowedAccountsUseCase", "authVerifierMiddleware"], asClassArgs(GetFollowedAccounts))
    .service("getTrackingStatuses", ["getTrackingStatusesUseCase"], asClassArgs(GetTrackingStatuses))
    .service("getRegistrationStatus", ["getRegistrationStatusUseCase", "authVerifierMiddleware"], asClassArgs(GetRegistrationStatus))
    .service("registerAccount", ["registerAccountUseCase", "authVerifierMiddleware"], asClassArgs(RegisterAccount))
    .service("unregisterAccount", ["unregisterAccountUseCase", "authVerifierMiddleware"], asClassArgs(UnregisterAccount))
    .service("removeMember", ["removeMemberUseCase", "adminMiddleware"], asClassArgs(RemoveMember))
    .service("updateSeen", ["updateSeenUseCase", "authVerifierMiddleware"], asClassArgs(UpdateSeen))
    .service("lexRouter", ["getPostThread", "searchPosts", "getActorLikes", "getAuthorFeed", "getTimeline", "getListFeed", "getFollows", "getFollowers", "getKnownFollowers", "getList", "getLists", "getListsWithMembership", "getUnreadCount", "listNotifications", "getGroupedNotifications", "updateSeen", "getRegistrationStatus", "getTrackingStatuses", "registerAccount", "unregisterAccount", "removeMember", "createInviteCode", "deleteInviteCode", "getInviteCodes", "grantAdmin", "addMember", "revokeAdmin", "registerAdmin", "verifyAccess", "getLocalTimeline", "getServerMembers", "getSetupStatus", "getOperator", "getFollowedAccounts", "getServerMemberFollowers", "getPreferences", "getProfile", "getProfiles", "searchActors", "searchActorsTypeahead", "listServerMembers", "getLikes", "getRepostedBy", "getQuotes", "getFeedGenerators", "getPosts", "getPostThreadV2", "searchPostsV2"], lexRouterFactory)
    .service("healthRouter", ["env"], healthRouterFactory)
    .service("wellKnownRouter", ["env"], wellKnownRouterFactory)
    // bootstrap
    .service("appViewServer", ["loggerManager", "lexRouter", "healthRouter", "wellKnownRouter", "env"], asClass(AppViewServer));
