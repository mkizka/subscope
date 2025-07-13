import type { InferInsertModel } from "drizzle-orm";

import type * as schema from "./schema.js";

export type ActorInsert = Omit<
  InferInsertModel<typeof schema.actors>,
  "did" | "indexedAt"
>;

export type PostInsert = Omit<
  InferInsertModel<typeof schema.posts>,
  "uri" | "indexedAt" | "sortAt"
>;

export type ProfileInsert = Omit<
  InferInsertModel<typeof schema.profiles>,
  "uri" | "indexedAt"
>;

export type BlobInsert = Omit<
  InferInsertModel<typeof schema.blobs>,
  "cid" | "indexedAt"
>;

export type RecordInsert = Omit<
  InferInsertModel<typeof schema.records>,
  "uri" | "indexedAt"
>;

export type FollowInsert = Omit<
  InferInsertModel<typeof schema.follows>,
  "uri" | "indexedAt" | "sortAt"
>;

export type SubscriptionInsert = Omit<
  InferInsertModel<typeof schema.subscriptions>,
  "uri" | "indexedAt"
>;

export type GeneratorInsert = Omit<
  InferInsertModel<typeof schema.generators>,
  "uri" | "indexedAt"
>;

export type LikeInsert = Omit<
  InferInsertModel<typeof schema.likes>,
  "uri" | "indexedAt" | "sortAt"
>;
