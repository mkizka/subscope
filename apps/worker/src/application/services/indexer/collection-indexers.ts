import type {
  CollectionIndexers,
  ICollectionIndexer,
} from "./collection-indexer.js";
import type { FollowIndexer } from "./follow-indexer.js";
import type { GateIndexer } from "./gate-indexer.js";
import type { GeneratorIndexer } from "./generator-indexer.js";
import type { LikeIndexer } from "./like-indexer.js";
import type { LinkIndexer } from "./link-indexer.js";
import type { ListIndexer } from "./list-indexer.js";
import type { ListItemIndexer } from "./list-item-indexer.js";
import type { PostIndexer } from "./post-indexer.js";
import type { ProfileIndexer } from "./profile-indexer.js";
import type { RepostIndexer } from "./repost-indexer.js";

const erase = <T>(indexer: ICollectionIndexer<T>) =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  indexer as ICollectionIndexer<unknown>;

export const collectionIndexersFactory = (
  postIndexer: PostIndexer,
  repostIndexer: RepostIndexer,
  likeIndexer: LikeIndexer,
  followIndexer: FollowIndexer,
  listItemIndexer: ListItemIndexer,
  profileIndexer: ProfileIndexer,
  generatorIndexer: GeneratorIndexer,
  listIndexer: ListIndexer,
  linkIndexer: LinkIndexer,
  gateIndexer: GateIndexer,
): CollectionIndexers => ({
  "app.bsky.feed.post": erase(postIndexer),
  "app.bsky.feed.repost": erase(repostIndexer),
  "app.bsky.feed.like": erase(likeIndexer),
  "app.bsky.graph.follow": erase(followIndexer),
  "app.bsky.graph.listitem": erase(listItemIndexer),
  "app.bsky.actor.profile": erase(profileIndexer),
  "app.bsky.feed.generator": erase(generatorIndexer),
  "app.bsky.graph.list": erase(listIndexer),
  "app.bsky.actor.link": erase(linkIndexer),
  "app.bsky.feed.threadgate": erase(gateIndexer),
  "app.bsky.feed.postgate": erase(gateIndexer),
});
