const enabled = { list: true, push: true };
const enabledFilterable = { include: "all", ...enabled };

export const emptyListResponses = new Map<string, object>([
  ["app.bsky.feed.getFeed", { feed: [] }],
  ["app.bsky.feed.getActorFeeds", { feeds: [] }],
  ["app.bsky.graph.getActorStarterPacks", { starterPacks: [] }],
  ["app.bsky.graph.getBlocks", { blocks: [] }],
  ["app.bsky.graph.getMutes", { mutes: [] }],
  ["app.bsky.graph.getListBlocks", { lists: [] }],
  ["app.bsky.graph.getListMutes", { lists: [] }],
  ["app.bsky.graph.getSuggestedFollowsByActor", { suggestions: [] }],
  [
    "app.bsky.graph.getStarterPacksWithMembership",
    { starterPacksWithMembership: [] },
  ],
  ["app.bsky.graph.searchStarterPacksV2", { starterPacks: [] }],
  ["app.bsky.labeler.getServices", { views: [] }],
  ["app.bsky.notification.listActivitySubscriptions", { subscriptions: [] }],
  ["app.bsky.bookmark.getBookmarks", { bookmarks: [] }],
  ["app.bsky.draft.getDrafts", { drafts: [] }],
  ["app.bsky.unspecced.getPopularFeedGenerators", { feeds: [] }],
  ["app.bsky.unspecced.getSuggestedFeeds", { feeds: [] }],
  ["app.bsky.unspecced.getTrends", { trends: [] }],
  ["app.bsky.unspecced.getSuggestedUsersForExplore", { actors: [] }],
  ["app.bsky.unspecced.getSuggestedUsersForDiscover", { actors: [] }],
  ["app.bsky.unspecced.getSuggestedUsersForSeeMore", { actors: [] }],
  ["app.bsky.unspecced.getSuggestedOnboardingUsers", { actors: [] }],
  ["app.bsky.unspecced.getSuggestedStarterPacks", { starterPacks: [] }],
  [
    "app.bsky.unspecced.getOnboardingSuggestedStarterPacks",
    { starterPacks: [] },
  ],
  [
    "app.bsky.unspecced.getAtmosphereExploreTab",
    {
      articles: { items: [] },
      publications: { items: [] },
      photos: { items: [] },
      livestreams: { items: [] },
      apps: [],
    },
  ],
]);

export const emptyResponses = new Map<string, object>([
  ...emptyListResponses,
  [
    "app.bsky.notification.getPreferences",
    {
      preferences: {
        chat: { include: "all", push: true },
        follow: enabledFilterable,
        like: enabledFilterable,
        likeViaRepost: enabledFilterable,
        mention: enabledFilterable,
        quote: enabledFilterable,
        reply: enabledFilterable,
        repost: enabledFilterable,
        repostViaRepost: enabledFilterable,
        starterpackJoined: enabled,
        subscribedPost: enabled,
        unverified: enabled,
        verified: enabled,
      },
    },
  ],
]);
