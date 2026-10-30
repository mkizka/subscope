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
  let postRepo: TestServices["postRepository"];
  let profileRepo: TestServices["profileRepository"];
  let recordRepo: TestServices["recordRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    getPostsUseCase = services.getPostsUseCase;
    postRepo = services.postRepository;
    profileRepo = services.profileRepository;
    recordRepo = services.recordRepository;
  });

  test("複数の投稿を、投稿と著者それぞれ1回のクエリでまとめて取る", async () => {
    // arrange
    const authors = [actorFactory(), actorFactory()];
    const posts = authors.map((author) => {
      profileRepo.add(profileDetailedFactory({ actorDid: author.did }));
      const { post, record } = postFactory({ actorDid: author.did });
      postRepo.add(post);
      recordRepo.add(record);
      return post;
    });
    const findByUris = vi.spyOn(postRepo, "findByUris");
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
