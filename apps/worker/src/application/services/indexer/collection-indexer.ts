import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import type { SupportedCollection } from "@repo/common/utils";

import type { Author } from "../../dto/author.js";
import type { Origin } from "../../dto/origin.js";
import type { Record } from "../../dto/record.js";
import type { Notification } from "../../interfaces/repositories/notification-repository.js";

export interface ICollectionIndexer<T> {
  parse: (record: Record) => T;
  pastWindowDate?: (parsed: T) => Date;
  shouldStore?: (input: {
    ctx: TransactionContext;
    parsed: T;
    author: Author;
    origin: Origin;
  }) => boolean | Promise<boolean>;
  save?: (input: { ctx: TransactionContext; parsed: T }) => Promise<void>;
  recordsToFetch?: (input: {
    parsed: T;
    author: Author;
    origin: Origin;
  }) => AtUri[];
  accountsToFetch?: (input: { parsed: T; author: Author }) => Did[];
  notificationCandidates?: (input: {
    ctx: TransactionContext;
    parsed: T;
  }) => Notification[] | Promise<Notification[]>;
  postsToAggregate?: (parsed: T) => AtUri[];
  accountsToAggregate?: (parsed: T) => Did[];
  reposToSync?: (input: { parsed: T; author: Author }) => Did[];
}

export type CollectionIndexers = {
  [collection in SupportedCollection]: ICollectionIndexer<unknown>;
};
