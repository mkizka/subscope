import { asDid } from "@atproto/did";
import { actorFactory, postFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetPostsUseCase", () => {
  let getPostsUseCase: TestServices["getPostsUseCase"];
  let postQuery: TestServices["postQuery"];
  let profileQuery: TestServices["profileQuery"];
  let recordRepo: TestServices["recordQuery"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getPostsUseCase = services.getPostsUseCase;
    postQuery = services.postQuery;
    profileQuery = services.profileQuery;
    recordRepo = services.recordQuery;
  });

  test("複数の投稿を、投稿と著者それぞれ1回のクエリでまとめて取る", async () => {
    // arrange
    const authors = [actorFactory(), actorFactory()];
    const posts = authors.map((author) => {
      profileQuery.add({
        actorDid: asDid(author.did),
        handle: null,
        displayName: null,
        description: null,
        avatarCid: null,
        bannerCid: null,
        createdAt: null,
        indexedAt: new Date(),
        status: "active",
      });
      const { post, record } = postFactory({ actorDid: author.did });
      postQuery.add({
        uri: post.uri.toString(),
        actorDid: post.actorDid,
        embedImages: [],
        embedExternal: null,
        embedRecordUri: null,
        replyRootUri: null,
        replyParentUri: null,
        indexedAt: post.indexedAt,
      });
      recordRepo.add(record);
      return post;
    });
    const findByUris = vi.spyOn(postQuery, "findByUris");
    const findByDids = vi.spyOn(profileQuery, "findByDids");

    // act
    const result = await getPostsUseCase.execute(
      posts.map((post) => post.uri),
      {},
    );

    // assert
    expect(result.map((post) => post.author.did)).toEqual(
      authors.map((author) => asDid(author.did)),
    );
    expect(findByUris).toHaveBeenCalledTimes(1);
    expect(findByDids).toHaveBeenCalledTimes(1);
  });
});
