// 参考： https://github.com/bluesky-social/atproto/tree/main/packages/bsky/src/data-plane/server/db/tables
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const backfillStatus = ["dirty", "in-process", "synchronized"] as const;

export const actors = pgTable(
  "actors",
  {
    did: varchar({ length: 256 }).primaryKey(),
    handle: varchar({ length: 256 }),
    backfillStatus: varchar({ length: 20, enum: backfillStatus })
      .notNull()
      .default("dirty"),
    backfillVersion: integer(),
    indexedAt: timestamp().notNull(),
  },
  (table) => [index("handle_idx").on(table.handle)],
);

export const records = pgTable("records", {
  uri: varchar({ length: 256 }).primaryKey(),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  json: jsonb().notNull(),
  indexedAt: timestamp().notNull(),
});

export const follows = pgTable(
  "follows",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    subjectDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    createdAt: timestamp().notNull(),
    indexedAt: timestamp().notNull(),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [
    index("follows_sort_at_idx").on(table.sortAt),
    index("follows_actor_did_idx").on(table.actorDid),
    index("follows_subject_did_idx").on(table.subjectDid),
    index("follows_actor_subject_idx").on(table.actorDid, table.subjectDid),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    avatarCid: varchar({ length: 256 }),
    description: text(),
    displayName: varchar({ length: 256 }),
    createdAt: timestamp(),
    indexedAt: timestamp().notNull(),
  },
  (table) => [index("profiles_actor_idx").on(table.actorDid)],
);

export const posts = pgTable(
  "posts",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    text: text().notNull(),
    replyRootUri: varchar({ length: 256 }),
    replyRootCid: varchar({ length: 256 }),
    replyParentUri: varchar({ length: 256 }),
    replyParentCid: varchar({ length: 256 }),
    langs: jsonb().$type<string[]>(),
    createdAt: timestamp().notNull(),
    indexedAt: timestamp().notNull(),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [
    index("posts_sort_at_idx").on(table.sortAt),
    // temp__cleanupDatabaseUseCaseで使用しているので消せるかも
    index("posts_indexed_at_idx").on(table.indexedAt),
    index("posts_reply_parent_uri_idx").on(table.replyParentUri),
    index("posts_reply_parent_sort_idx").on(
      table.replyParentUri,
      table.sortAt.desc(),
    ),
  ],
);

export const postStats = pgTable("post_stats", {
  postUri: varchar({ length: 256 })
    .primaryKey()
    .references(() => posts.uri, { onDelete: "cascade" }),
  likeCount: integer().notNull().default(0),
  repostCount: integer().notNull().default(0),
  replyCount: integer().notNull().default(0),
});

export const actorStats = pgTable("actor_stats", {
  actorDid: varchar({ length: 256 })
    .primaryKey()
    .references(() => actors.did, { onDelete: "cascade" }),
  followsCount: integer().notNull().default(0),
  followersCount: integer().notNull().default(0),
  postsCount: integer().notNull().default(0),
});

export const blobs = pgTable("blobs", {
  cid: varchar({ length: 256 }).primaryKey(),
  mimeType: varchar({ length: 256 }).notNull(),
  size: integer().notNull(),
  indexedAt: timestamp().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  uri: varchar({ length: 256 })
    .primaryKey()
    .references(() => records.uri, { onDelete: "cascade" }),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  appviewDid: varchar({ length: 256 }).notNull(),
  createdAt: timestamp().notNull(),
  indexedAt: timestamp().notNull(),
});

export const generators = pgTable("generators", {
  uri: varchar({ length: 256 })
    .primaryKey()
    .references(() => records.uri, { onDelete: "cascade" }),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  did: varchar({ length: 256 }).notNull(),
  displayName: varchar({ length: 240 }).notNull(),
  description: text(),
  avatarCid: varchar({ length: 256 }),
  createdAt: timestamp().notNull(),
  indexedAt: timestamp().notNull(),
});

export const likes = pgTable(
  "likes",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    subjectUri: varchar({ length: 256 }).notNull(),
    subjectCid: varchar({ length: 256 }).notNull(),
    createdAt: timestamp().notNull(),
    indexedAt: timestamp().defaultNow(),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [
    index("likes_sort_at_idx").on(table.sortAt),
    index("likes_subject_uri_idx").on(table.subjectUri),
    index("likes_subject_sort_idx").on(table.subjectUri, table.sortAt.desc()),
  ],
);

export const reposts = pgTable(
  "reposts",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    subjectUri: varchar({ length: 256 }).notNull(),
    subjectCid: varchar({ length: 256 }).notNull(),
    createdAt: timestamp().notNull(),
    indexedAt: timestamp().defaultNow(),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [
    index("reposts_sort_at_idx").on(table.sortAt),
    index("reposts_subject_uri_idx").on(table.subjectUri),
    index("reposts_subject_sort_idx").on(table.subjectUri, table.sortAt.desc()),
  ],
);

const feedType = ["post", "repost"] as const;

export const feedItems = pgTable(
  "feed_items",
  {
    uri: varchar({ length: 256 })
      .primaryKey()
      .references(() => records.uri, { onDelete: "cascade" }),
    cid: varchar({ length: 256 }).notNull(),
    type: varchar({ length: 20, enum: feedType }).notNull(),
    subjectUri: varchar({ length: 256 }),
    actorDid: varchar({ length: 256 })
      .notNull()
      .references(() => actors.did),
    sortAt: timestamp().notNull(),
    indexedAt: timestamp().defaultNow(),
  },
  (table) => [
    index("feed_items_sort_at_idx").on(table.sortAt),
    index("feed_items_actor_did_idx").on(table.actorDid),
    index("feed_items_actor_sort_idx").on(table.actorDid, table.sortAt.desc()),
  ],
);

export const postEmbedImages = pgTable("post_embed_images", {
  postUri: varchar({ length: 256 })
    .notNull()
    .references(() => posts.uri, { onDelete: "cascade" }),
  cid: varchar({ length: 256 }).notNull(),
  position: integer().notNull(),
  alt: text().notNull(),
  aspectRatioWidth: integer(),
  aspectRatioHeight: integer(),
});

export const postEmbedExternals = pgTable("post_embed_externals", {
  postUri: varchar({ length: 256 })
    .primaryKey()
    .references(() => posts.uri, { onDelete: "cascade" }),
  uri: text().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  thumbCid: varchar({ length: 256 }),
});

export const postEmbedRecords = pgTable("post_embed_records", {
  postUri: varchar({ length: 256 })
    .primaryKey()
    .references(() => posts.uri, { onDelete: "cascade" }),
  // 埋め込まれたレコード(投稿)はすでに削除されたものである可能性が一応あるので外部制約は設定しない
  uri: varchar({ length: 256 }).notNull(),
  cid: varchar({ length: 256 }).notNull(),
});

export const actorsRelations = relations(actors, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [actors.did],
    references: [profiles.actorDid],
  }),
  posts: many(posts),
  stats: one(actorStats, {
    fields: [actors.did],
    references: [actorStats.actorDid],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  actor: one(actors, {
    fields: [posts.actorDid],
    references: [actors.did],
  }),
  embedImages: many(postEmbedImages),
  embedExternal: one(postEmbedExternals, {
    fields: [posts.uri],
    references: [postEmbedExternals.postUri],
  }),
  embedRecord: one(postEmbedRecords, {
    fields: [posts.uri],
    references: [postEmbedRecords.postUri],
  }),
  stats: one(postStats, {
    fields: [posts.uri],
    references: [postStats.postUri],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(actors, {
    fields: [profiles.actorDid],
    references: [actors.did],
  }),
  avatar: one(blobs, {
    fields: [profiles.avatarCid],
    references: [blobs.cid],
  }),
}));

export const postEmbedImagesRelations = relations(
  postEmbedImages,
  ({ one }) => ({
    post: one(posts, {
      fields: [postEmbedImages.postUri],
      references: [posts.uri],
    }),
  }),
);

export const postEmbedExternalsRelations = relations(
  postEmbedExternals,
  ({ one }) => ({
    post: one(posts, {
      fields: [postEmbedExternals.postUri],
      references: [posts.uri],
    }),
  }),
);

export const postEmbedRecordsRelations = relations(
  postEmbedRecords,
  ({ one }) => ({
    post: one(posts, {
      fields: [postEmbedRecords.postUri],
      references: [posts.uri],
    }),
  }),
);

export const imageBlobCache = pgTable(
  "image_blob_cache",
  {
    cacheKey: varchar({ length: 512 }).primaryKey(),
    expiredAt: timestamp().notNull(),
    status: varchar({ length: 20, enum: ["success", "failed"] as const })
      .notNull()
      .default("success"),
  },
  (table) => [index("image_blob_cache_expired_at_idx").on(table.expiredAt)],
);

export const postStatsRelations = relations(postStats, ({ one }) => ({
  post: one(posts, {
    fields: [postStats.postUri],
    references: [posts.uri],
  }),
}));

export const actorStatsRelations = relations(actorStats, ({ one }) => ({
  actor: one(actors, {
    fields: [actorStats.actorDid],
    references: [actors.did],
  }),
}));

export const blobsRelations = relations(blobs, ({ many }) => ({
  profiles: many(profiles),
}));
