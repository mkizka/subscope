// 参考： https://github.com/bluesky-social/atproto/tree/main/packages/bsky/src/data-plane/server/db/tables
import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  index,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const actors = mysqlTable(
  "actors",
  {
    did: varchar({ length: 256 }).primaryKey(),
    handle: varchar({ length: 256 }),
    indexedAt: timestamp().defaultNow(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => [index("handle_idx").on(table.handle)],
);

export const record = mysqlTable("record", {
  uri: varchar({ length: 256 }).primaryKey(),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  json: json().notNull(),
  indexedAt: timestamp().defaultNow(),
});

export const profiles = mysqlTable("profiles", {
  uri: varchar({ length: 256 })
    .primaryKey()
    .references(() => record.uri),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  avatarCid: varchar({ length: 256 }),
  description: text(),
  displayName: varchar({ length: 256 }),
  createdAt: timestamp(),
  indexedAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

export const posts = mysqlTable("posts", {
  uri: varchar({ length: 256 })
    .primaryKey()
    .references(() => record.uri),
  cid: varchar({ length: 256 }).notNull(),
  actorDid: varchar({ length: 256 })
    .notNull()
    .references(() => actors.did),
  text: text().notNull(),
  langs: json().$type<string[]>(),
  createdAt: timestamp().notNull(),
  indexedAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

export const blobs = mysqlTable("blobs", {
  cid: varchar({ length: 256 }).primaryKey(),
  mimeType: varchar({ length: 256 }).notNull(),
  size: int().notNull(),
  indexedAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

export const actorsRelations = relations(actors, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [actors.did],
    references: [profiles.actorDid],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  actor: one(actors, {
    fields: [posts.actorDid],
    references: [actors.did],
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

export const blobsRelations = relations(blobs, ({ many }) => ({
  profiles: many(profiles),
}));
