import { asDid } from "@atproto/did";
import { FeedItem } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { expect, test } from "vitest";

import { testRegistry } from "../../../shared/test-utils.js";

test("リストのメンバーの投稿のみを返す", async () => {
  // arrange
  const services = await testRegistry.resolve();
  const listUri = "at://did:plc:owner/app.bsky.graph.list/1";
  const member = actorFactory();
  const nonMember = actorFactory();
  services.timelineRepository.addListItem(listUri, asDid(member.did));

  const posts = [member, nonMember].map((actor) => {
    services.profileRepository.add(
      profileDetailedFactory({ actorDid: actor.did }),
    );
    const { post, record } = postFactory({ actorDid: actor.did });
    services.postRepository.add(post);
    services.recordRepository.add(record);
    services.timelineRepository.addFeedItem(FeedItem.fromPost(post));
    return post;
  });

  // act
  const result = await services.getListFeedUseCase.execute({
    listUri,
    limit: 50,
  });

  // assert
  expect(result.feed).toMatchObject([
    { post: { uri: posts[0]?.uri.toString() } },
  ]);
});
