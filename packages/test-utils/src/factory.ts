import { AtUri } from "@atproto/syntax";
import { faker } from "@faker-js/faker";
import { defineFactory } from "@praha/drizzle-factory";
import { schema } from "@repo/db";

export const actorFactory = defineFactory({
  schema: { actors: schema.actors },
  table: "actors",
  resolver: ({ sequence }) => ({
    did: `did:plc:example${sequence}`,
    handle: `example${sequence}.test`,
    backfillStatus: "dirty",
    backfillVersion: 1,
    indexedAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  }),
});

export const recordFactory = (collection: string) =>
  defineFactory({
    schema: { records: schema.records },
    table: "records",
    resolver: ({ sequence, use }) => {
      const actor = use(actorFactory).create();
      return {
        uri: async () =>
          AtUri.make(
            (await actor).did,
            collection,
            `example${sequence}`,
          ).toString(),
        cid: `bafyreicidexample${sequence}`,
        actorDid: async () => (await actor).did,
        json: { $type: collection },
        indexedAt: faker.date.recent(),
      };
    },
  });

export const postFactory = defineFactory({
  schema: { posts: schema.posts },
  table: "posts",
  resolver: ({ sequence, use }) => {
    const record = use(recordFactory("app.bsky.feed.post")).create();
    return {
      uri: async () => (await record).uri,
      cid: `bafyreicidpostexample${sequence}`,
      actorDid: async () => (await record).actorDid,
      text: faker.lorem.sentence(),
      createdAt: faker.date.recent(),
    };
  },
});

export const postStatsFactory = defineFactory({
  schema: { post_stats: schema.postStats },
  table: "post_stats",
  resolver: ({ use }) => {
    return {
      postUri: () =>
        use(postFactory)
          .create()
          .then((post) => post.uri),
      likeCount: faker.number.int({ min: 0, max: 100 }),
      repostCount: faker.number.int({ min: 0, max: 100 }),
      replyCount: faker.number.int({ min: 0, max: 100 }),
      quoteCount: 0,
    };
  },
});
