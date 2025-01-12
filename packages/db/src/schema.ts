import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  did: varchar("did", { length: 256 }).primaryKey(),
  handle: varchar("handle", { length: 256 }),
  indexedAt: timestamp("indexedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const profiles = mysqlTable("profiles", {
  did: varchar("did", { length: 256 }).primaryKey(),
  avatarCid: varchar("avatarCid", { length: 256 }),
  description: text("description"),
  displayName: varchar("displayName", { length: 256 }),
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

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.did],
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
