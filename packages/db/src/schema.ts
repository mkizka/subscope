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
    did: varchar("did", { length: 256 }).primaryKey(),
    handle: varchar("handle", { length: 256 }),
    indexedAt: timestamp("indexed_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
  },
  (table) => [index("handle_idx").on(table.handle)],
);

export const record = mysqlTable("record", {
  uri: varchar("uri", { length: 256 }).primaryKey(),
  cid: varchar("cid", { length: 256 }),
  actorDid: varchar("did", { length: 256 }).references(() => actors.did),
  json: json("json"),
  indexedAt: timestamp("indexed_at").defaultNow(),
});

export const profiles = mysqlTable("profiles", {
  actorDid: varchar("actor_did", { length: 256 })
    .primaryKey()
    .references(() => actors.did),
  avatarCid: varchar("avatar_cid", { length: 256 }),
  description: text("description"),
  displayName: varchar("display_name", { length: 256 }),
  createdAt: timestamp("created_at"),
  indexedAt: timestamp("indexed_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const posts = mysqlTable("posts", {
  uri: varchar("uri", { length: 256 }).primaryKey(),
  cid: varchar("cid", { length: 256 }),
  actorDid: varchar("actor_did", { length: 256 }).references(() => actors.did),
  text: text("text"),
  langs: json("langs").$type<string[]>(),
  createdAt: timestamp("created_at"),
  indexedAt: timestamp("indexed_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const blobs = mysqlTable("blobs", {
  cid: varchar("cid", { length: 256 }).primaryKey(),
  mimeType: varchar("mime_type", { length: 256 }).notNull(),
  size: int("size").notNull(),
  indexedAt: timestamp("indexed_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
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
