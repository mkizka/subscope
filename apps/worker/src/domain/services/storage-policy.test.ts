import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { Follow } from "../follow.js";
import { Like } from "../like.js";
import { ListItem } from "../list-item.js";
import { Origin } from "../origin.js";
import { postFactory } from "../post.factory.js";
import { recordFactory } from "../record.factory.js";
import { Repost } from "../repost.js";

const author = "did:plc:author";
const subject = "did:plc:subject";
const subjectPostUri = `at://${subject}/app.bsky.feed.post/1`;
const createdAt = new Date().toISOString();

const repost = Repost.fromRecord(
  recordFactory({
    uri: `at://${author}/app.bsky.feed.repost/1`,
    json: {
      $type: "app.bsky.feed.repost",
      subject: { uri: subjectPostUri, cid: fakeCid() },
      createdAt,
    },
  }),
);
const like = Like.fromRecord(
  recordFactory({
    uri: `at://${author}/app.bsky.feed.like/1`,
    json: {
      $type: "app.bsky.feed.like",
      subject: { uri: subjectPostUri, cid: fakeCid() },
      createdAt,
    },
  }),
);
const follow = Follow.fromRecord(
  recordFactory({
    uri: `at://${author}/app.bsky.graph.follow/1`,
    json: { $type: "app.bsky.graph.follow", subject, createdAt },
  }),
);
const listItem = ListItem.fromRecord(
  recordFactory({
    uri: `at://${author}/app.bsky.graph.listitem/1`,
    json: {
      $type: "app.bsky.graph.listitem",
      subject,
      list: `at://${author}/app.bsky.graph.list/1`,
      createdAt,
    },
  }),
);

describe("StoragePolicy", () => {
  let storagePolicy: TestServices["storagePolicy"];
  let registrationQuery: TestServices["registrationQuery"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    storagePolicy = services.storagePolicy;
    registrationQuery = services.registrationQuery;
    ctx = { db: services.db };
  });

  describe("recordsToFetch", () => {
    test("引用のない投稿の場合、何も取りに行かない", async () => {
      // arrange
      const { post } = postFactory();

      // act
      const uris = await storagePolicy.recordsToFetch({
        ctx,
        origin: Origin.live(),
        record: post,
      });

      // assert
      expect(uris).toEqual([]);
    });

    test("リポストの場合、リポスト元の投稿を取りに行く", async () => {
      // act
      const uris = await storagePolicy.recordsToFetch({
        ctx,
        origin: Origin.live(),
        record: repost,
      });

      // assert
      expect(uris.map(String)).toEqual([subjectPostUri]);
    });

    test("メンバーのいいねの場合、いいねした投稿を取りに行く", async () => {
      // arrange
      registrationQuery.add(author);

      // act
      const uris = await storagePolicy.recordsToFetch({
        ctx,
        origin: Origin.live(),
        record: like,
      });

      // assert
      expect(uris.map(String)).toEqual([subjectPostUri]);
    });

    test("メンバー以外のいいねの場合、いいねした投稿を取りに行かない", async () => {
      // act
      const uris = await storagePolicy.recordsToFetch({
        ctx,
        origin: Origin.live(),
        record: like,
      });

      // assert
      expect(uris).toEqual([]);
    });
  });

  describe("accountsToFetch", () => {
    test("投稿の場合、作者だけを取りに行く", async () => {
      // arrange
      const { post } = postFactory();

      // act
      const dids = await storagePolicy.accountsToFetch({ ctx, record: post });

      // assert
      expect(dids).toEqual([post.accountDid]);
    });

    test.each([
      { name: "フォロー", record: follow },
      { name: "リスト項目", record: listItem },
    ])("メンバーの$nameの場合、作者と相手を取りに行く", async ({ record }) => {
      // arrange
      registrationQuery.add(author);

      // act
      const dids = await storagePolicy.accountsToFetch({ ctx, record });

      // assert
      expect(dids).toEqual([author, subject]);
    });

    test.each([
      { name: "フォロー", record: follow },
      { name: "リスト項目", record: listItem },
    ])(
      "メンバー以外の$nameの場合、作者だけを取りに行く",
      async ({ record }) => {
        // act
        const dids = await storagePolicy.accountsToFetch({ ctx, record });

        // assert
        expect(dids).toEqual([author]);
      },
    );
  });
});
