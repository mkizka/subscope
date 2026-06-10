import { FeedItem } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
  repostFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("FeedProcessor", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("投稿のみの場合、FeedViewPostのリストを返す", async () => {
    const {
      feedProcessor,
      postRepository,
      recordRepository,
      profileRepository,
    } = services;
    // arrange
    const author = actorFactory();
    const profile = profileDetailedFactory({
      actorDid: author.did,
      handle: author.handle,
      displayName: "Post Author",
    });
    profileRepository.add(profile);

    const { post, record } = postFactory({
      actorDid: author.did,
    });
    postRepository.add(post);
    recordRepository.add(record);

    const feedItem = FeedItem.fromPost(post);

    // act
    const result = await feedProcessor.processFeedItems([feedItem]);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: post.uri.toString(),
          cid: post.cid,
          author: {
            did: author.did,
            handle: author.handle,
            displayName: "Post Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
          indexedAt: expect.any(String),
        },
      },
    ]);
  });

  test("リポストの場合、reasonを含むFeedViewPostを返す", async () => {
    const {
      feedProcessor,
      postRepository,
      recordRepository,
      profileRepository,
      repostRepository,
    } = services;
    // arrange
    const originalAuthor = actorFactory();
    const originalProfile = profileDetailedFactory({
      actorDid: originalAuthor.did,
      handle: originalAuthor.handle,
      displayName: "Original Author",
    });
    profileRepository.add(originalProfile);

    const reposter = actorFactory();
    const reposterProfile = profileDetailedFactory({
      actorDid: reposter.did,
      handle: reposter.handle,
      displayName: "Reposter",
    });
    profileRepository.add(reposterProfile);

    const { post: originalPost, record: originalRecord } = postFactory({
      actorDid: originalAuthor.did,
    });
    postRepository.add(originalPost);
    recordRepository.add(originalRecord);

    const repost = repostFactory({
      actorDid: reposter.did,
      subjectUri: originalPost.uri.toString(),
      subjectCid: originalPost.cid,
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
      indexedAt: new Date("2024-01-01T01:00:00.000Z"),
    });
    repostRepository.add(repost);

    const feedItem = FeedItem.fromRepost(repost);

    // act
    const result = await feedProcessor.processFeedItems([feedItem]);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: originalPost.uri.toString(),
          author: {
            displayName: "Original Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
        },
        reason: {
          $type: "app.bsky.feed.defs#reasonRepost",
          by: {
            did: reposter.did,
            handle: reposter.handle,
            displayName: "Reposter",
          },
          indexedAt: "2024-01-01T01:00:00.000Z",
        },
      },
    ]);
  });

  test("リプライ投稿の場合、replyを含むFeedViewPostを返す", async () => {
    const {
      feedProcessor,
      postRepository,
      recordRepository,
      profileRepository,
    } = services;
    // arrange
    const rootAuthor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootAuthor.did,
      handle: rootAuthor.handle,
      displayName: "Root Author",
    });
    profileRepository.add(rootProfile);

    const replyAuthor = actorFactory();
    const replyProfile = profileDetailedFactory({
      actorDid: replyAuthor.did,
      handle: replyAuthor.handle,
      displayName: "Reply Author",
    });
    profileRepository.add(replyProfile);

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootAuthor.did,
    });
    postRepository.add(rootPost);
    recordRepository.add(rootRecord);

    const { post: replyPost, record: replyRecord } = postFactory({
      actorDid: replyAuthor.did,
      replyRoot: { uri: rootPost.uri, cid: rootPost.cid },
      replyParent: { uri: rootPost.uri, cid: rootPost.cid },
    });
    postRepository.add(replyPost);
    recordRepository.add(replyRecord);

    const feedItem = FeedItem.fromPost(replyPost);

    // act
    const result = await feedProcessor.processFeedItems([feedItem]);

    // assert
    expect(result).toMatchObject([
      {
        $type: "app.bsky.feed.defs#feedViewPost",
        post: {
          uri: replyPost.uri.toString(),
          author: {
            displayName: "Reply Author",
          },
          record: {
            $type: "app.bsky.feed.post",
          },
        },
        reply: {
          root: {
            $type: "app.bsky.feed.defs#postView",
            uri: rootPost.uri.toString(),
            author: {
              displayName: "Root Author",
            },
          },
          parent: {
            $type: "app.bsky.feed.defs#postView",
            uri: rootPost.uri.toString(),
            author: {
              displayName: "Root Author",
            },
          },
        },
      },
    ]);
  });

  test("複数の投稿とリポストが混在する場合、正しい順序で返す", async () => {
    const {
      feedProcessor,
      postRepository,
      recordRepository,
      profileRepository,
      repostRepository,
    } = services;
    // arrange
    const author1 = actorFactory();
    const profile1 = profileDetailedFactory({
      actorDid: author1.did,
      handle: author1.handle,
      displayName: "Author 1",
    });
    profileRepository.add(profile1);

    const author2 = actorFactory();
    const profile2 = profileDetailedFactory({
      actorDid: author2.did,
      handle: author2.handle,
      displayName: "Author 2",
    });
    profileRepository.add(profile2);

    const reposter = actorFactory();
    const reposterProfile = profileDetailedFactory({
      actorDid: reposter.did,
      handle: reposter.handle,
      displayName: "Reposter",
    });
    profileRepository.add(reposterProfile);

    const { post: post1, record: record1 } = postFactory({
      actorDid: author1.did,
    });
    postRepository.add(post1);
    recordRepository.add(record1);

    const { post: post2, record: record2 } = postFactory({
      actorDid: author2.did,
    });
    postRepository.add(post2);
    recordRepository.add(record2);

    const repost = repostFactory({
      actorDid: reposter.did,
      subjectUri: post2.uri.toString(),
      subjectCid: post2.cid,
      indexedAt: new Date("2024-01-01T02:00:00.000Z"),
    });
    repostRepository.add(repost);

    const feedItem1 = FeedItem.fromPost(post1);
    const feedItem2 = FeedItem.fromRepost(repost);

    // act
    const result = await feedProcessor.processFeedItems([feedItem1, feedItem2]);

    // assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      post: { uri: post1.uri.toString() },
    });
    expect(result[0]).not.toHaveProperty("reason");
    expect(result[1]).toMatchObject({
      post: { uri: post2.uri.toString() },
      reason: {
        $type: "app.bsky.feed.defs#reasonRepost",
        by: { displayName: "Reposter" },
        indexedAt: "2024-01-01T02:00:00.000Z",
      },
    });
  });

  test("PostViewが見つからない場合、その項目をスキップする", async () => {
    const { feedProcessor } = services;
    // arrange
    const author = actorFactory();
    const { post } = postFactory({
      actorDid: author.did,
    });

    const feedItem = FeedItem.fromPost(post);

    // act
    const result = await feedProcessor.processFeedItems([feedItem]);

    // assert
    expect(result).toMatchObject([]);
  });
});
