// 参考： https://github.com/bluesky-social/atproto/tree/main/packages/bsky/src/data-plane/server/db/tables
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const backfillStatus = ["dirty", "in-process", "synchronized"] as const;

export type BackfillStatus = (typeof backfillStatus)[number];

export const actors = pgTable(
  "actors",
  {
    did: varchar({ length: 256 }).primaryKey(),
    handle: varchar({ length: 256 }),
    backfillStatus: varchar({ length: 20, enum: backfillStatus })
      .notNull()
      .default("dirty"),
    backfillVersion: integer(),
    indexedAt: timestamp().defaultNow(),
    updatedAt: timestamp().$onUpdate(() => new Date()),
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
  indexedAt: timestamp().defaultNow(),
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
    subjectDid: varchar({ length: 256 }).notNull(),
    createdAt: timestamp().notNull(),
    indexedAt: timestamp().defaultNow(),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [index("follows_sort_at_idx").on(table.sortAt)],
);

export const profiles = pgTable("profiles", {
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
  indexedAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
});

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
    indexedAt: timestamp().defaultNow(),
    updatedAt: timestamp().$onUpdate(() => new Date()),
    sortAt: timestamp()
      .generatedAlwaysAs(sql`least("created_at", "indexed_at")`)
      .notNull(),
  },
  (table) => [
    index("posts_sort_at_idx").on(table.sortAt),
    // temp__cleanupDatabaseUseCaseで使用しているので消せるかも
    index("posts_indexed_at_idx").on(table.indexedAt),
  ],
);

export const blobs = pgTable("blobs", {
  cid: varchar({ length: 256 }).primaryKey(),
  mimeType: varchar({ length: 256 }).notNull(),
  size: integer().notNull(),
  indexedAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
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
  indexedAt: timestamp().defaultNow(),
});

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

export const actorsRelations = relations(actors, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [actors.did],
    references: [profiles.actorDid],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  actor: one(actors, {
    fields: [posts.actorDid],
    references: [actors.did],
  }),
  embedImages: many(postEmbedImages),
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

export const blobsRelations = relations(blobs, ({ many }) => ({
  profiles: many(profiles),
}));
