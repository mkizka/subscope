import { asDid } from "@atproto/did";
import { FeedItem } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  profileDetailedFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { setupTestServer } from "../../../../../shared/test-utils.js";

describe("app.bsky.feed.getTimeline", () => {
  test("認証がない場合、401を返す", async () => {
    // arrange
    const { client } = await setupTestServer();

    // act
    const promise = client.app.bsky.feed.getTimeline();

    // assert
    await expect(promise).rejects.toMatchObject({ status: 401 });
  });

  test("フォロイーの投稿がある場合、feedViewPostとして返す", async () => {
    // arrange
    const { services, client } = await setupTestServer();
    const viewer = actorFactory();
    const author = actorFactory();
    services.tokenVerifier.setVerifyResult({ did: asDid(viewer.did) });
    services.profileRepository.add(
      profileDetailedFactory({ actorDid: author.did }),
    );
    services.timelineRepository.addFollow(asDid(viewer.did), asDid(author.did));
    const { post, record } = postFactory({ actorDid: author.did });
    services.postRepository.add(post);
    services.recordRepository.add(record);
    services.timelineRepository.addFeedItem(FeedItem.fromPost(post));

    // act
    const res = await client.app.bsky.feed.getTimeline(
      {},
      { headers: { authorization: "Bearer token" } },
    );

    // assert
    expect(res.data.feed).toMatchObject([
      { post: { uri: post.uri.toString(), author: { did: author.did } } },
    ]);
  });
});
