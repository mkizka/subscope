import { fakeCid } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../shared/test-utils.js";
import { parseRecord } from "../dto/parsed-record.js";
import { recordFactory } from "../dto/record.factory.js";

describe("SaveRecordService", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("投稿の場合、投稿とフィードの項目を保存する", async () => {
    // arrange
    const { saveRecordService, postRepository, feedItemRepository, db } =
      services;
    const author = accountFactory();
    const record = recordFactory({
      uri: `at://${author.did}/app.bsky.feed.post/postkey123`,
      json: {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await postRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri,
      cid: record.cid,
      accountDid: author.did,
      text: "test post",
    });
    expect(
      await feedItemRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      type: "post",
      accountDid: author.did,
      subjectUri: null,
    });
  });

  test("投稿の日付が無効（0000-01-01）な場合も、エラーなく保存する", async () => {
    // arrange
    const { saveRecordService, postRepository, feedItemRepository, db } =
      services;
    const record = recordFactory({
      uri: `at://${accountFactory().did}/app.bsky.feed.post/postkey000`,
      json: {
        $type: "app.bsky.feed.post",
        text: "投稿に無効な日付が含まれている",
        createdAt: "0000-01-01T00:00:00.000Z",
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    const post = await postRepository.find({ ctx: { db }, uri: record.uri });
    expect(post?.createdAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));
    const feedItem = await feedItemRepository.find({
      ctx: { db },
      uri: record.uri,
    });
    expect(feedItem?.sortAt).toEqual(new Date("0000-01-01T00:00:00.000Z"));
  });

  test("リポストの場合、リポストとフィードの項目を保存する", async () => {
    // arrange
    const { saveRecordService, repostRepository, feedItemRepository, db } =
      services;
    const reposter = accountFactory();
    const subjectUri = `at://${accountFactory().did}/app.bsky.feed.post/123`;
    const record = recordFactory({
      uri: `at://${reposter.did}/app.bsky.feed.repost/repostrkey123`,
      json: {
        $type: "app.bsky.feed.repost",
        subject: { uri: subjectUri, cid: fakeCid() },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await repostRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: reposter.did,
      subjectUri,
    });
    expect(
      await feedItemRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      type: "repost",
      accountDid: reposter.did,
      subjectUri,
    });
  });

  test("いいねの場合、いいねを保存する", async () => {
    // arrange
    const { saveRecordService, likeRepository, db } = services;
    const liker = accountFactory();
    const postUri = "at://did:plc:other/app.bsky.feed.post/123";
    const record = recordFactory({
      uri: `at://${liker.did}/app.bsky.feed.like/likerkey123`,
      json: {
        $type: "app.bsky.feed.like",
        subject: { uri: postUri, cid: fakeCid() },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await likeRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: liker.did,
      subjectUri: postUri,
    });
  });

  test("フォローの場合、フォローとフォロー先のアカウントを保存する", async () => {
    // arrange
    const { saveRecordService, followRepository, accountRepository, db } =
      services;
    const follower = accountFactory();
    const followee = accountFactory();
    const record = recordFactory({
      uri: `at://${follower.did}/app.bsky.graph.follow/followrkey123`,
      json: {
        $type: "app.bsky.graph.follow",
        subject: followee.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await followRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: follower.did,
      subjectDid: followee.did,
    });
    expect(
      await accountRepository.find({ ctx: { db }, did: followee.did }),
    ).not.toBeNull();
  });

  test("リストの場合、リストを保存する", async () => {
    // arrange
    const { saveRecordService, listRepository, db } = services;
    const account = accountFactory();
    const record = recordFactory({
      uri: `at://${account.did}/app.bsky.graph.list/listrkey123`,
      json: {
        $type: "app.bsky.graph.list",
        purpose: "app.bsky.graph.defs#curatelist",
        name: "テストリスト",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await listRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      accountDid: account.did,
      purpose: "app.bsky.graph.defs#curatelist",
      name: "テストリスト",
    });
  });

  test("リスト項目の場合、リスト項目と対象のアカウントを保存する", async () => {
    // arrange
    const { saveRecordService, listItemRepository, accountRepository, db } =
      services;
    const account = accountFactory();
    const subject = accountFactory();
    const listUri = `at://${account.did}/app.bsky.graph.list/listrkey123`;
    const record = recordFactory({
      uri: `at://${account.did}/app.bsky.graph.listitem/itemrkey123`,
      json: {
        $type: "app.bsky.graph.listitem",
        list: listUri,
        subject: subject.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    const listItem = await listItemRepository.find({
      ctx: { db },
      uri: record.uri,
    });
    expect(listItem).toMatchObject({
      accountDid: account.did,
      subjectDid: subject.did,
    });
    expect(listItem?.listUri.toString()).toBe(listUri);
    expect(
      await accountRepository.find({ ctx: { db }, did: subject.did }),
    ).not.toBeNull();
  });

  test("プロフィールの場合、プロフィールを保存する", async () => {
    // arrange
    const { saveRecordService, profileRepository, db } = services;
    const account = accountFactory();
    const avatarCid = fakeCid();
    const bannerCid = fakeCid();
    const record = recordFactory({
      uri: `at://${account.did}/app.bsky.actor.profile/self`,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Test User",
        description: "Test description",
        avatar: {
          $type: "blob",
          ref: { $link: avatarCid },
          mimeType: "image/jpeg",
          size: 1000,
        },
        banner: {
          $type: "blob",
          ref: { $link: bannerCid },
          mimeType: "image/jpeg",
          size: 2000,
        },
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await saveRecordService.save({
      ctx: { db },
      record,
      parsed: parseRecord(record),
    });

    // assert
    expect(
      await profileRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: account.did,
      displayName: "Test User",
      description: "Test description",
      avatarCid,
      bannerCid,
    });
  });
});
