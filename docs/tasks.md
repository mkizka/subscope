# 実装リスト

## app.bsky.actor

- [x] app/bsky/actor/getProfile.json
- [x] app/bsky/actor/getProfiles.json
- [ ] app/bsky/actor/searchActors.json

優先度低い

- [ ] app/bsky/actor/getPreferences.json
- [ ] app/bsky/actor/putPreferences.json
- [ ] app/bsky/actor/getSuggestions.json
- [ ] app/bsky/actor/searchActorsTypeahead.json

## app.bsky.feed

- [ ] app/bsky/feed/getActorLikes.json
- [ ] app/bsky/feed/getLikes.json
- [ ] app/bsky/feed/getPostThread.json
- [x] app/bsky/feed/getPosts.json
  - ブロックなどは未反映
- [x] app/bsky/feed/getTimeline.json
- [ ] app/bsky/feed/searchPosts.json

優先度低い

- [ ] app/bsky/feed/getListFeed.json
- [ ] app/bsky/feed/getQuotes.json
- [ ] app/bsky/feed/getRepostedBy.json
- [ ] app/bsky/feed/getSuggestedFeeds.json
- [ ] app/bsky/feed/sendInteractions.json

## app.bsky.graph

- [ ] app/bsky/graph/getFollowers.json
- [ ] app/bsky/graph/getFollows.json

優先度低い

- [ ] app/bsky/graph/getKnownFollowers.json
- [ ] app/bsky/graph/getRelationships.json ← 使われていない？

## 後回しにする

カスタムフィード

- [ ] app/bsky/feed/describeFeedGenerator.json
- [ ] app/bsky/feed/getActorFeeds.json
- [ ] app/bsky/feed/getAuthorFeed.json
- [ ] app/bsky/feed/getFeed.json
- [ ] app/bsky/feed/getFeedGenerator.json
- [ ] app/bsky/feed/getFeedGenerators.json
- [ ] app/bsky/feed/getFeedSkeleton.json

ブロック機能

- [ ] app/bsky/graph/getBlocks.json

リスト

- [ ] app/bsky/graph/getList.json
- [ ] app/bsky/graph/getListBlocks.json
- [ ] app/bsky/graph/getLists.json
- [ ] app/bsky/graph/getListMutes.json

ミュート

- [ ] app/bsky/graph/getMutes.json
- [ ] app/bsky/graph/muteActor.json
- [ ] app/bsky/graph/muteActorList.json
- [ ] app/bsky/graph/muteThread.json
- [ ] app/bsky/graph/unmuteActor.json
- [ ] app/bsky/graph/unmuteActorList.json
- [ ] app/bsky/graph/unmuteThread.json

スターターパックは対応しない

- [ ] ~~app/bsky/graph/getActorStarterPacks.json~~
- [ ] ~~app/bsky/graph/getStarterPack.json~~
- [ ] ~~app/bsky/graph/getStarterPacks.json~~
- [ ] ~~app/bsky/graph/searchStarterPacks.json~~
- [ ] ~~app/bsky/graph/starterpack.json~~
