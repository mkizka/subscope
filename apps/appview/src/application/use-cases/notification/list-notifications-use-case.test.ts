import { asDid } from "@atproto/did";
import { actorFactory, profileDetailedFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ListNotificationsUseCase", () => {
  let listNotificationsUseCase: TestServices["listNotificationsUseCase"];
  let notificationQuery: TestServices["notificationQuery"];
  let profileRepo: TestServices["profileRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    listNotificationsUseCase = services.listNotificationsUseCase;
    notificationQuery = services.notificationQuery;
    profileRepo = services.profileRepository;
  });

  test("通知がある場合、新しい順に作成者のプロフィールと共に返し、limitを超えればcursorを返す", async () => {
    // arrange
    const viewer = actorFactory();
    const author = actorFactory();
    profileRepo.add(
      profileDetailedFactory({ actorDid: author.did, handle: "author.test" }),
    );
    const notify = (sortAt: string, isRead: boolean) =>
      notificationQuery.add({
        recipientDid: viewer.did,
        recordUri: `at://${author.did}/app.bsky.feed.like/${sortAt}`,
        cid: "bafyreib",
        record: { $type: "app.bsky.feed.like" },
        authorDid: author.did,
        reason: "like",
        reasonSubject: `at://${viewer.did}/app.bsky.feed.post/1`,
        sortAt: new Date(sortAt),
        isRead,
      });
    notify("2024-01-01T00:00:00.000Z", true);
    notify("2024-01-02T00:00:00.000Z", false);

    // act
    const result = await listNotificationsUseCase.execute({
      viewerDid: asDid(viewer.did),
      limit: 1,
    });

    // assert
    expect(result).toEqual({
      cursor: "2024-01-02T00:00:00.000Z",
      notifications: [
        {
          uri: `at://${author.did}/app.bsky.feed.like/2024-01-02T00:00:00.000Z`,
          cid: "bafyreib",
          author: expect.objectContaining({
            did: author.did,
            handle: "author.test",
          }),
          reason: "like",
          reasonSubject: `at://${viewer.did}/app.bsky.feed.post/1`,
          record: { $type: "app.bsky.feed.like" },
          isRead: false,
          indexedAt: "2024-01-02T00:00:00.000Z",
        },
      ],
    });
  });
});
