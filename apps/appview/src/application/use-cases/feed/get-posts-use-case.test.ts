import { asDid } from "@atproto/did";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetPostsUseCase", () => {
  let getPostsUseCase: TestServices["getPostsUseCase"];
  let postQuery: TestServices["postQuery"];
  let profileRepo: TestServices["profileRepository"];
  let recordRepo: TestServices["recordQuery"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getPostsUseCase = services.getPostsUseCase;
    postQuery = services.postQuery;
    profileRepo = services.profileRepository;
    recordRepo = services.recordQuery;
  });

  test("複数の投稿を、投稿と著者それぞれ1回のクエリでまとめて取る", async () => {
    // arrange
    const authors = [actorFactory(), actorFactory()];
    const posts = authors.map((author) => {
      profileRepo.add(profileDetailedFactory({ actorDid: author.did }));
      const { post, record } = postFactory({ actorDid: author.did });
      postQuery.add({
        uri: post.uri.toString(),
        actorDid: post.actorDid,
        embedImages: [],
        embedExternal: null,
        embedRecordUri: null,
        indexedAt: post.indexedAt,
      });
      recordRepo.add(record);
      return post;
    });
    const findByUris = vi.spyOn(postQuery, "findByUris");
    const findManyDetailed = vi.spyOn(profileRepo, "findManyDetailed");

    // act
    const result = await getPostsUseCase.execute(posts.map((post) => post.uri));

    // assert
    expect(result.map((post) => post.author.did)).toEqual(
      authors.map((author) => asDid(author.did)),
    );
    expect(findByUris).toHaveBeenCalledTimes(1);
    expect(findManyDetailed).toHaveBeenCalledTimes(1);
  });
});
