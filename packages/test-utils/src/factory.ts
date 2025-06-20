import { AtUri } from "@atproto/syntax";
import { factory, later } from "@factory-js/factory";
import { faker } from "@faker-js/faker";
import { schema } from "@repo/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { create } from "./create.js";

type Database = NodePgDatabase<typeof schema>;

const fakeDid = () =>
  `did:plc:${faker.string.alphanumeric({ length: 24, casing: "lower" })}`;

const fakeHandle = () => faker.internet.domainName();

const fakeAtUri = ({ did, collection }: { did?: string; collection: string }) =>
  AtUri.make(
    did ?? fakeDid(),
    collection,
    faker.string.alphanumeric({ length: 13, casing: "lower" }),
  ).toString();

const fakeCid = () =>
  `bafyre${faker.string.alphanumeric({ length: 46, casing: "lower" })}`;

export const actorFactory = (db: Database) =>
  factory.define(
    {
      props: {
        did: () => fakeDid(),
        handle: () => fakeHandle(),
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
          uri: later<string>(),
          cid: () => `bafyre${faker.string.alphanumeric(46)}`,
          actorDid: later<string>(),
          json: () => ({ $type: collection }),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          actorDid: () => null as string | null,
          actor: () => actorFactory(db).create(),
        },
      },
      (props) => create(db, schema.records, props),
    )
    .props({
      uri: async ({ vars }) =>
        fakeAtUri({
          did: (await vars.actorDid) ?? (await vars.actor).did,
          collection,
        }),
      actorDid: async ({ vars }) =>
        (await vars.actorDid) ?? (await vars.actor).did,
    });

export const postFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: () => fakeCid(),
          actorDid: later<string>(),
          text: () => faker.lorem.sentence(),
          replyRootUri: () => null as string | null,
          replyRootCid: () => null as string | null,
          replyParentUri: () => null as string | null,
          replyParentCid: () => null as string | null,
          langs: () => [],
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.feed.post").create(),
        },
      },
      (props) => create(db, schema.posts, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
    })
    .traits({
      withProfile: {
        after: async (post) => {
          const profileRecord = await recordFactory(
            db,
            "app.bsky.actor.profile",
          )
            .vars({ actorDid: () => post.actorDid })
            .create();
          await profileFactory(db)
            .vars({
              record: () => profileRecord,
            })
            .create();
        },
      },
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

export const profileFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: () => fakeCid(),
          actorDid: later<string>(),
          avatarCid: () => fakeCid(),
          description: () => faker.lorem.sentence(),
          displayName: () => faker.person.fullName(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
          updatedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.actor.profile").create(),
        },
      },
      (props) => create(db, schema.profiles, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
    });
