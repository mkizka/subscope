/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { AtUri } from "@atproto/syntax";
import { factory, later } from "@factory-js/factory";
import { faker } from "@faker-js/faker";
import { schema } from "@repo/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { randomCid } from "./cid.js";
import { create } from "./create.js";
import { refreshSubscriberFollowees } from "./setup.js";

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

export const actorFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          did: () => fakeDid(),
          handle: () => fakeHandle() as string | null,
          syncRepoStatus: () =>
            "dirty" as "dirty" | "in-process" | "synchronized",
          syncRepoVersion: () => null,
          indexedAt: () => faker.date.recent(),
        },
        vars: {},
      },
      (props) => create(db, schema.actors, props),
    )
    .traits({
      withProfile: (params: { displayName?: string }) => ({
        after: async (actor) => {
          const record = await recordFactory(db, "app.bsky.actor.profile")
            .vars({ actor: () => actor })
            .create();
          await profileFactory(db)
            .vars({ record: () => record })
            .props({
              displayName: () => params.displayName ?? faker.person.fullName(),
            })
            .create();
        },
      }),
      subscriber: () => ({
        after: async (actor) => {
          await subscriptionFactory(db)
            .vars({ actor: () => actor })
            .create();
        },
      }),
    });

export const recordFactory = (db: Database, collection: string) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: () => randomCid(),
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
          cid: later<string>(),
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
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
    })
    .traits({
      asReplyTo: (
        parent: { uri: string; cid: string },
        root?: { uri: string; cid: string },
      ) => ({
        props: {
          replyParentUri: () => parent.uri,
          replyParentCid: () => parent.cid,
          replyRootUri: () => (root ?? parent).uri,
          replyRootCid: () => (root ?? parent).cid,
        },
      }),
    });

export const postStatsFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          likeCount: () => faker.number.int({ min: 0, max: 10 }),
          repostCount: () => faker.number.int({ min: 0, max: 10 }),
          replyCount: () => faker.number.int({ min: 0, max: 10 }),
          quoteCount: () => faker.number.int({ min: 0, max: 10 }),
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
          cid: later<string>(),
          actorDid: later<string>(),
          avatarCid: () => randomCid(),
          bannerCid: () => randomCid(),
          description: () => faker.lorem.sentence(),
          displayName: () => faker.person.fullName() as string | null,
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.actor.profile").create(),
        },
      },
      (props) => create(db, schema.profiles, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
    });

export const followFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          actorDid: later<string>(),
          subjectDid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.graph.follow").create(),
          followee: () => actorFactory(db).create(),
        },
      },
      (props) => create(db, schema.follows, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
      subjectDid: async ({ vars }) => (await vars.followee).did,
    })
    .after(async () => {
      await refreshSubscriberFollowees();
    });

export const likeFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          actorDid: later<string>(),
          subjectUri: later<string>(),
          subjectCid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.feed.like").create(),
          subject: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.likes, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
      subjectUri: async ({ vars }) => (await vars.subject).uri,
      subjectCid: async ({ vars }) => (await vars.subject).cid,
    });

export const actorStatsFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          actorDid: later<string>(),
          followsCount: () => 0,
          followersCount: () => 0,
          postsCount: () => 0,
        },
        vars: {
          actor: () => actorFactory(db).create(),
        },
      },
      (props) => create(db, schema.actorStats, props),
    )
    .props({
      actorDid: async ({ vars }) => (await vars.actor).did,
    });

export const repostFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          actorDid: later<string>(),
          subjectUri: later<string>(),
          subjectCid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.feed.repost").create(),
          subject: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.reposts, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
      subjectUri: async ({ vars }) => (await vars.subject).uri,
      subjectCid: async ({ vars }) => (await vars.subject).cid,
    });

export const postFeedItemFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          type: () => "post" as const,
          subjectUri: later<string>(),
          actorDid: later<string>(),
          sortAt: later<Date>(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          post: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.feedItems, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.post).uri,
      cid: async ({ vars }) => (await vars.post).cid,
      actorDid: async ({ vars }) => (await vars.post).actorDid,
      subjectUri: async ({ vars }) => (await vars.post).uri,
      sortAt: async ({ vars }) => (await vars.post).createdAt,
    });

export const repostFeedItemFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          type: () => "repost" as const,
          subjectUri: later<string>(),
          actorDid: later<string>(),
          sortAt: later<Date>(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          repost: () => repostFactory(db).create(),
        },
      },
      (props) => create(db, schema.feedItems, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.repost).uri,
      cid: async ({ vars }) => (await vars.repost).cid,
      actorDid: async ({ vars }) => (await vars.repost).actorDid,
      subjectUri: async ({ vars }) => (await vars.repost).subjectUri,
      sortAt: async ({ vars }) => (await vars.repost).createdAt,
    });

export const subscriptionFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          actorDid: later<string>(),
          inviteCode: later<string>(),
          createdAt: () => faker.date.recent(),
        },
        vars: {
          actor: () => actorFactory(db).create(),
          inviteCode: () => inviteCodeFactory(db).create(),
        },
      },
      (props) => create(db, schema.subscriptions, props),
    )
    .props({
      actorDid: async ({ vars }) => (await vars.actor).did,
      inviteCode: async ({ vars }) => (await vars.inviteCode).code,
    });

export const postEmbedImageFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          cid: () => randomCid(),
          position: () => faker.number.int({ min: 0, max: 3 }),
          alt: () => faker.lorem.sentence(),
          aspectRatioWidth: () => faker.number.int({ min: 100, max: 2000 }),
          aspectRatioHeight: () => faker.number.int({ min: 100, max: 2000 }),
        },
        vars: {
          post: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.postEmbedImages, props),
    )
    .props({
      postUri: async ({ vars }) => (await vars.post).uri,
    });

export const postEmbedExternalFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          uri: () => faker.internet.url(),
          title: () => faker.lorem.sentence(),
          description: () => faker.lorem.paragraph(),
          thumbCid: () => randomCid(),
        },
        vars: {
          post: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.postEmbedExternals, props),
    )
    .props({
      postUri: async ({ vars }) => (await vars.post).uri,
    });

export const postEmbedRecordFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          uri: later<string>(),
          cid: later<string>(),
        },
        vars: {
          post: () => postFactory(db).create(),
          embeddedPost: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.postEmbedRecords, props),
    )
    .props({
      postUri: async ({ vars }) => (await vars.post).uri,
      uri: async ({ vars }) => (await vars.embeddedPost).uri,
      cid: async ({ vars }) => (await vars.embeddedPost).cid,
    });

export const generatorFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          actorDid: later<string>(),
          did: () => fakeDid(),
          displayName: () => faker.company.name(),
          description: () => faker.lorem.sentence() as string | null,
          avatarCid: () => null as string | null,
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.feed.generator").create(),
        },
      },
      (props) => create(db, schema.generators, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      actorDid: async ({ vars }) => (await vars.record).actorDid,
    });

export const inviteCodeFactory = (db: Database) =>
  factory.define(
    {
      props: {
        code: () => `example-com-${faker.string.alphanumeric(5)}`,
        expiresAt: () => faker.date.future(),
        usedAt: (): Date | null => null,
        createdAt: () => faker.date.recent(),
      },
      vars: {},
    },
    (props) => create(db, schema.inviteCodes, props),
  );
