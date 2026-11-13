/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { AtUri } from "@atproto/syntax";
import { factory, later } from "@factory-js/factory";
import { faker } from "@faker-js/faker";
import type { AccountStatus } from "@repo/db";
import { schema } from "@repo/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { randomCid } from "./cid.js";
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

export const accountFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          did: () => fakeDid(),
          handle: () => fakeHandle() as string | null,
          indexedAt: () => faker.date.recent(),
          isAdmin: () => false,
          isBanned: () => false,
          status: (): AccountStatus => "active",
          backfillStatus: () =>
            null as "inProgress" | "completed" | "error" | null,
        },
        vars: {},
      },
      (props) => create(db, schema.accounts, props),
    )
    .traits({
      withProfile: (params: { displayName?: string }) => ({
        after: async (account) => {
          const record = await recordFactory(db, "app.bsky.actor.profile")
            .vars({ account: () => account })
            .create();
          await profileFactory(db)
            .vars({ record: () => record })
            .props({
              displayName: () => params.displayName ?? faker.person.fullName(),
            })
            .create();
        },
      }),
      serverMember: () => ({
        after: async (account) => {
          await registrationFactory(db)
            .vars({ account: () => account })
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
          accountDid: later<string>(),
          json: () => ({ $type: collection }),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          accountDid: () => null as string | null,
          account: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.records, props),
    )
    .props({
      uri: async ({ vars }) =>
        fakeAtUri({
          did: (await vars.accountDid) ?? (await vars.account).did,
          collection,
        }),
      accountDid: async ({ vars }) =>
        (await vars.accountDid) ?? (await vars.account).did,
    });

export const postFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.record).accountDid,
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
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.record).accountDid,
    });

export const followFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
          subjectDid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.graph.follow").create(),
          followee: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.follows, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      accountDid: async ({ vars }) => (await vars.record).accountDid,
      subjectDid: async ({ vars }) => (await vars.followee).did,
    });

export const blockFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
          subjectDid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.graph.block").create(),
          subject: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.blocks, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      accountDid: async ({ vars }) => (await vars.record).accountDid,
      subjectDid: async ({ vars }) => (await vars.subject).did,
    });

export const likeFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.record).accountDid,
      subjectUri: async ({ vars }) => (await vars.subject).uri,
      subjectCid: async ({ vars }) => (await vars.subject).cid,
    });

export const accountStatsFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          accountDid: later<string>(),
          followsCount: () => 0,
          followersCount: () => 0,
          postsCount: () => 0,
        },
        vars: {
          account: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.accountStats, props),
    )
    .props({
      accountDid: async ({ vars }) => (await vars.account).did,
    });

export const repostFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.record).accountDid,
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
          subjectUri: () => null,
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.post).accountDid,
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
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.repost).accountDid,
      subjectUri: async ({ vars }) => (await vars.repost).subjectUri,
      sortAt: async ({ vars }) => (await vars.repost).createdAt,
    });

export const registrationFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          accountDid: later<string>(),
          inviteCode: later<string>(),
          createdAt: () => faker.date.recent(),
        },
        vars: {
          account: () => accountFactory(db).create(),
          inviteCode: () => inviteCodeFactory(db).create(),
        },
      },
      (props) => create(db, schema.registrations, props),
    )
    .props({
      accountDid: async ({ vars }) => (await vars.account).did,
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
          embedType: (): "images" | "gallery" => "images",
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

export const postEmbedVideoFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          postUri: later<string>(),
          cid: () => randomCid(),
          alt: () => faker.lorem.sentence(),
          aspectRatioWidth: () => faker.number.int({ min: 100, max: 2000 }),
          aspectRatioHeight: () => faker.number.int({ min: 100, max: 2000 }),
          presentation: () => "default",
        },
        vars: {
          post: () => postFactory(db).create(),
        },
      },
      (props) => create(db, schema.postEmbedVideos, props),
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
          accountDid: later<string>(),
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
      accountDid: async ({ vars }) => (await vars.record).accountDid,
    });

export const listFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
          purpose: () => "app.bsky.graph.defs#curatelist",
          name: () => faker.lorem.words(),
          description: () => faker.lorem.sentence() as string | null,
          avatarCid: () => null as string | null,
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.graph.list").create(),
        },
      },
      (props) => create(db, schema.lists, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      accountDid: async ({ vars }) => (await vars.record).accountDid,
    });

export const listItemFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          uri: later<string>(),
          cid: later<string>(),
          accountDid: later<string>(),
          listUri: later<string>(),
          subjectDid: later<string>(),
          createdAt: () => faker.date.recent(),
          indexedAt: () => faker.date.recent(),
        },
        vars: {
          record: () => recordFactory(db, "app.bsky.graph.listitem").create(),
          list: () => listFactory(db).create(),
          subject: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.listItems, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.record).uri,
      cid: async ({ vars }) => (await vars.record).cid,
      accountDid: async ({ vars }) => (await vars.record).accountDid,
      listUri: async ({ vars }) => (await vars.list).uri,
      subjectDid: async ({ vars }) => (await vars.subject).did,
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

export const labelFactory = (db: Database) =>
  factory
    .define(
      {
        props: {
          src: () => "did:plc:ar7c4by46qjdydhdevvrndac",
          uri: later<string>(),
          val: () => "!takedown",
          accountDid: later<string>(),
          cid: () => null as string | null,
          cts: () => faker.date.recent(),
          exp: () => null as Date | null,
        },
        vars: {
          account: () => accountFactory(db).create(),
        },
      },
      (props) => create(db, schema.labels, props),
    )
    .props({
      uri: async ({ vars }) => (await vars.account).did,
      accountDid: async ({ vars }) => (await vars.account).did,
    });
