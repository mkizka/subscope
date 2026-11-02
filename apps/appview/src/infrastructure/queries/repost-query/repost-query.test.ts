import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  accountFactory,
  postFactory,
  recordFactory,
  repostFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RepostQuery } from "./repost-query.js";

describe("RepostQuery", () => {
  const { ctx } = testSetup;

  const repostQuery = new RepostQuery(ctx.db);

  describe("findViewerReposts", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await repostQuery.findViewerReposts({
        viewerDid: asDid("did:plc:viewer"),
        subjectUris: [],
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定されたビューアーのリポストだけを、リポストのURIと対象のURIで返す", async () => {
      // arrange
      const viewer = await accountFactory(ctx.db).create();
      const [viewerRepost, otherRepost] = await Promise.all([
        repostFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.repost")
                .vars({ account: () => viewer })
                .create(),
          })
          .create(),
        repostFactory(ctx.db).create(),
      ]);

      // act
      const result = await repostQuery.findViewerReposts({
        viewerDid: asDid(viewer.did),
        subjectUris: [viewerRepost, otherRepost].map(
          (repost) => new AtUri(repost.subjectUri),
        ),
      });

      // assert
      expect(result).toEqual([
        {
          uri: viewerRepost.uri,
          accountDid: viewerRepost.accountDid,
          subjectUri: viewerRepost.subjectUri,
          indexedAt: viewerRepost.indexedAt,
          sortAt: viewerRepost.sortAt,
        },
      ]);
    });
  });

  describe("findBySubject", () => {
    test("指定された投稿へのリポストがない場合、空の配列を返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });

    test("指定された投稿へのリポストがある場合、リポストのリストを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const repostAccount = await accountFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount })
        .create();
      const repost = await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord,
          subject: () => post,
        })
        .create();

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toEqual([
        {
          uri: repost.uri,
          accountDid: repost.accountDid,
          subjectUri: post.uri,
          indexedAt: repost.indexedAt,
          sortAt: repost.sortAt,
        },
      ]);
    });

    test("複数のリポストがある場合、sortAtの降順で返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const repostAccount1 = await accountFactory(ctx.db).create();
      const repostRecord1 = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount1 })
        .create();
      const repost1 = await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord1,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const repostAccount2 = await accountFactory(ctx.db).create();
      const repostRecord2 = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount2 })
        .create();
      const repost2 = await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord2,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post.uri,
        limit: 10,
      });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.uri).toBe(repost2.uri);
      expect(result[1]?.uri).toBe(repost1.uri);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const repostAccounts = await accountFactory(ctx.db).createList(3);
      const repostRecords = await Promise.all(
        repostAccounts.map((repostAccount) =>
          recordFactory(ctx.db, "app.bsky.feed.repost")
            .vars({ account: () => repostAccount })
            .create(),
        ),
      );
      await Promise.all(
        repostRecords.map((repostRecord) =>
          repostFactory(ctx.db)
            .vars({
              record: () => repostRecord,
              subject: () => post,
            })
            .create(),
        ),
      );

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post.uri,
        limit: 2,
      });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のリポストを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .create();

      const repostAccount1 = await accountFactory(ctx.db).create();
      const repostRecord1 = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount1 })
        .create();
      const repost1 = await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord1,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const repostAccount2 = await accountFactory(ctx.db).create();
      const repostRecord2 = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount2 })
        .create();
      await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord2,
          subject: () => post,
        })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = new Date("2024-01-01T01:30:00.000Z");

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post.uri,
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.uri).toBe(repost1.uri);
    });

    test("異なる投稿へのリポストは含まれない", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const record1 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post1 = await postFactory(ctx.db)
        .vars({ record: () => record1 })
        .create();

      const record2 = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ account: () => account })
        .create();
      const post2 = await postFactory(ctx.db)
        .vars({ record: () => record2 })
        .create();

      const repostAccount = await accountFactory(ctx.db).create();
      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ account: () => repostAccount })
        .create();
      await repostFactory(ctx.db)
        .vars({
          record: () => repostRecord,
          subject: () => post2,
        })
        .create();

      // act
      const result = await repostQuery.findBySubject({
        subjectUri: post1.uri,
        limit: 10,
      });

      // assert
      expect(result).toEqual([]);
    });
  });
});
