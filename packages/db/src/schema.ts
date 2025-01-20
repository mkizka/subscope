import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// TODO: actorsにかえる
export const users = mysqlTable(
  "users",
  {
    did: varchar("did", { length: 256 }).primaryKey(),
    handle: varchar("handle", { length: 256 }),
    indexedAt: timestamp("indexedAt").defaultNow(),
    updatedAt: timestamp("updatedAt").onUpdateNow(),
  },
  (table) => [index("handle_idx").on(table.handle)],
);

export const profiles = mysqlTable("profiles", {
  // TODO: actorDidにかえる
  did: varchar("did", { length: 256 }).primaryKey(),
  avatarCid: varchar("avatarCid", { length: 256 }),
  description: text("description"),
  displayName: varchar("displayName", { length: 256 }),
  createdAt: timestamp("createdAt"),
  indexedAt: timestamp("indexedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const posts = mysqlTable("posts", {
  rkey: varchar("rkey", { length: 256 }).primaryKey(),
  actorDid: varchar("actorDid", { length: 256 }).references(() => users.did),
  text: text("text"),
  langs: varchar("langs", { length: 3 }),
  createdAt: timestamp("createdAt"),
  indexedAt: timestamp("indexedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const blobs = mysqlTable("blobs", {
  cid: varchar("cid", { length: 256 }).primaryKey(),
  mimeType: varchar("mimeType", { length: 256 }).notNull(),
  size: int("size").notNull(),
  indexedAt: timestamp("indexedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.did],
    references: [profiles.did],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  actor: one(profiles, {
    fields: [posts.actorDid],
    references: [profiles.did],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.did],
    references: [users.did],
  }),
  avatar: one(blobs, {
    fields: [profiles.avatarCid],
    references: [blobs.cid],
  }),
}));

export const blobsRelations = relations(blobs, ({ many }) => ({
  profiles: many(profiles),
}));
