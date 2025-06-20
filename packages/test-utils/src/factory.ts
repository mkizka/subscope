import { AtUri } from "@atproto/syntax";
import { factory, later } from "@factory-js/factory";
import { faker } from "@faker-js/faker";
import { schema } from "@repo/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { create } from "./create.js";

type Database = NodePgDatabase<typeof schema>;

const randomDid = () => () => `did:plc:${faker.string.alphanumeric(16)}`;

const randomHandle = () => () => faker.internet.domainName();

const randomAtUri = (collection: string) => () =>
  AtUri.make(
    randomDid()(),
    collection,
    faker.string.alphanumeric(16),
  ).toString();

const randomCid = () => () => `bafyre${faker.string.alphanumeric(46)}`;

export const actorFactory = (db: Database) =>
  factory.define(
    {
      props: {
        did: randomDid(),
        handle: randomHandle(),
        backfillStatus: () => "dirty" as const,
        backfillVersion: () => null,
        indexedAt: () => faker.date.recent(),
        updatedAt: () => faker.date.recent(),
      },
      vars: {},
    },
    (props) => create(db, schema.actors, props),
  );

export const recordFactory = (db: Database, collection: string) =>
  factory
    .define(
      {
        props: {
          uri: randomAtUri(collection),
          cid: () => `bafyre${faker.string.alphanumeric(46)}`,
          actorDid: later<string>(),
          json: () => ({ $type: collection }),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          actor: () => actorFactory(db).create(),
        },
      },
      (props) => create(db, schema.records, props),
    )
    .props({
      actorDid: async ({ vars }) => (await vars.actor).did,
    });

export const postFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: randomCid(),
          actorDid: later<string>(),
          text: () => faker.lorem.sentence(),
          replyRootUri: () => null,
          replyRootCid: () => null,
          replyParentUri: () => null,
          replyParentCid: () => null,
          langs: () => [],
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.feed.post").create(),
          actor: () => actorFactory(db).create(),
        },
      },
      (props) => create(db, schema.posts, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      actorDid: async ({ vars }) => (await vars.actor).did,
    });

export const postStatsFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          likeCount: () => faker.number.int({ min: 0, max: 100 }),
          repostCount: () => faker.number.int({ min: 0, max: 50 }),
          replyCount: () => faker.number.int({ min: 0, max: 30 }),
        },
        vars: {
          post: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.postStats, props),
    )
    .props({
      postUri: async ({ vars }) => (await vars.post).uri,
    });
