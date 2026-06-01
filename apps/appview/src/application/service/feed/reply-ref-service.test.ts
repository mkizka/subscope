import { AtUri } from "@atproto/syntax";
import { Post } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { ReplyRefService } from "./reply-ref-service.js";

describe("ReplyRefService", () => {
  const replyRefService = testInjector.injectClass(ReplyRefService);

  const postRepo = testInjector.resolve("postRepository");
  const recordRepo = testInjector.resolve("recordRepository");
  const profileRepo = testInjector.resolve("profileRepository");

  test("リプライがない投稿のみの場合、空のMapを返す", async () => {
    // arrange
    const posts = [
      new Post({
        uri: new AtUri("at://did:plc:user1/app.bsky.feed.post/1"),
        cid: "cid1",
        actorDid: "did:plc:user1",
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result).toEqual(new Map());
  });

  test("リプライがある場合、reply情報を含むMapを返す", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      handle: rootActor.handle,
      displayName: "User 1",
    });
    profileRepo.add(rootProfile);

    const replyActor = actorFactory();

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const { post: parentPost, record: parentRecord } = postFactory({
      actorDid: rootActor.did,
    });
    postRepo.add(parentPost);
    recordRepo.add(parentRecord);

    const replyUri = new AtUri(
      `at://${replyActor.did}/app.bsky.feed.post/reply`,
    );

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: replyActor.did,
        text: "Reply post",
        replyRoot: { uri: rootPost.uri, cid: "root-cid" },
        replyParent: { uri: parentPost.uri, cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri.toString(),
      },
      parent: {
        uri: parentPost.uri.toString(),
      },
    });
  });

  test("複数のリプライがある場合、すべてのreply情報を含むMapを返す", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      handle: rootActor.handle,
      displayName: "User 3",
    });
    profileRepo.add(rootProfile);

    const reply1Actor = actorFactory();
    const reply2Actor = actorFactory();

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
      cid: "root-cid-2",
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const { post: parentPost, record: parentRecord } = postFactory({
      actorDid: rootActor.did,
      cid: "parent-cid-2",
    });
    postRepo.add(parentPost);
    recordRepo.add(parentRecord);

    const reply1Uri = new AtUri(
      `at://${reply1Actor.did}/app.bsky.feed.post/reply1`,
    );
    const reply2Uri = new AtUri(
      `at://${reply2Actor.did}/app.bsky.feed.post/reply2`,
    );

    const posts = [
      new Post({
        uri: reply1Uri,
        cid: "reply1-cid",
        actorDid: reply1Actor.did,
        text: "Reply 1",
        replyRoot: { uri: rootPost.uri, cid: "root-cid-2" },
        replyParent: { uri: parentPost.uri, cid: "parent-cid-2" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
      new Post({
        uri: reply2Uri,
        cid: "reply2-cid",
        actorDid: reply2Actor.did,
        text: "Reply 2",
        replyRoot: { uri: rootPost.uri, cid: "root-cid-2" },
        replyParent: { uri: rootPost.uri, cid: "root-cid-2" }, // 同じrootへの直接リプライ
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(reply1Uri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri.toString(),
      },
      parent: {
        uri: parentPost.uri.toString(),
      },
    });
    expect(result.get(reply2Uri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri.toString(),
      },
      parent: {
        uri: rootPost.uri.toString(),
      },
    });
  });

  test("PostViewが見つからない場合、NotFoundPostを含むreply情報を返す", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:notfound/app.bsky.feed.post/root");
    const parentUri = new AtUri(
      "at://did:plc:notfound/app.bsky.feed.post/parent",
    );
    const replyUri = new AtUri("at://did:plc:user6/app.bsky.feed.post/reply");

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user6",
        text: "Reply post",
        replyRoot: { uri: rootUri, cid: "root-cid" },
        replyParent: { uri: parentUri, cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: rootUri.toString(),
        notFound: true,
      },
      parent: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: parentUri.toString(),
        notFound: true,
      },
    });
  });

  test("リプライとノーマル投稿が混在している場合、リプライのみを処理する", async () => {
    // arrange
    const rootActor = actorFactory();
    const rootProfile = profileDetailedFactory({
      actorDid: rootActor.did,
      handle: rootActor.handle,
      displayName: "User 7",
    });
    profileRepo.add(rootProfile);

    const replyActor = actorFactory();
    const normalActor = actorFactory();

    const { post: rootPost, record: rootRecord } = postFactory({
      actorDid: rootActor.did,
      cid: "root-cid-3",
    });
    postRepo.add(rootPost);
    recordRepo.add(rootRecord);

    const { post: parentPost, record: parentRecord } = postFactory({
      actorDid: rootActor.did,
      cid: "parent-cid-3",
    });
    postRepo.add(parentPost);
    recordRepo.add(parentRecord);

    const replyUri = new AtUri(
      `at://${replyActor.did}/app.bsky.feed.post/reply`,
    );
    const normalUri = new AtUri(
      `at://${normalActor.did}/app.bsky.feed.post/normal`,
    );

    const posts = [
      new Post({
        uri: normalUri,
        cid: "normal-cid",
        actorDid: normalActor.did,
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: replyActor.did,
        text: "Reply post",
        replyRoot: { uri: rootPost.uri, cid: "root-cid-3" },
        replyParent: { uri: parentPost.uri, cid: "parent-cid-3" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.findMap(posts);

    // assert
    expect(result.get(replyUri.toString())).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootPost.uri.toString(),
      },
      parent: {
        uri: parentPost.uri.toString(),
      },
    });
    expect(result.get(normalUri.toString())).toBeUndefined();
  });
});
