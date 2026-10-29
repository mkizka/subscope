import { asDid } from "@atproto/did";
import { actorFactory, randomCid, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { setupJobTest } from "../shared/job-test-utils.js";

const rkeyOf = (subjectDid: string) => subjectDid.replaceAll(":", "-");

const followEvent = async (actorDid: string, subjectDid: string) => ({
  did: asDid(actorDid),
  live: true,
  commit: {
    operation: "create" as const,
    collection: "app.bsky.graph.follow" as const,
    rkey: rkeyOf(subjectDid),
    cid: await randomCid(),
    record: {
      $type: "app.bsky.graph.follow",
      subject: subjectDid,
      createdAt: new Date().toISOString(),
    },
  },
});

const unfollowEvent = (actorDid: string, subjectDid: string) => ({
  did: asDid(actorDid),
  live: true,
  commit: {
    operation: "delete" as const,
    collection: "app.bsky.graph.follow" as const,
    rkey: rkeyOf(subjectDid),
  },
});

describe("Tapへの登録", () => {
  const { ctx } = testSetup;

  test("tap-1: サブスクライバーがフォローしたアカウントをTapに登録する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(subscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-2: サブスクライバー以外のフォローではTapに登録しない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const nonSubscriber = await actorFactory(ctx.db).create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(nonSubscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-3: サブスクライバーがフォローを外したアカウントは、追跡アクターでなくなればTapから外す", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(subscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(subscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-4: 他のサブスクライバーがフォローしているアカウントはTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const otherSubscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(subscriber.did, followee.did));
    await indexCommit(await followEvent(otherSubscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(subscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-5: サブスクライバー以外がフォローを外してもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const nonSubscriber = await actorFactory(ctx.db).create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(subscriber.did, followee.did));
    await indexCommit(await followEvent(nonSubscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(nonSubscriber.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-6: サブスクライバーは、フォローを外されてもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followedSubscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    await indexCommit(
      await followEvent(subscriber.did, followedSubscriber.did),
    );
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(subscriber.did, followedSubscriber.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followedSubscriber.did);
  });
});
