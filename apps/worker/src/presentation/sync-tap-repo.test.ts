import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { schema } from "@repo/db";
import { actorFactory, randomCid, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupJobTest } from "../shared/job-test-utils.js";

let revCount = 0;
const nextRev = () => String(++revCount).padStart(13, "0");

const rkeyOf = (subjectDid: string) => subjectDid.replaceAll(":", "-");

const followEvent = async (
  actorDid: string,
  subjectDid: string,
): Promise<RecordEvent> => ({
  id: 1,
  type: "record",
  action: "create",
  did: asDid(actorDid),
  rev: nextRev(),
  collection: "app.bsky.graph.follow",
  rkey: rkeyOf(subjectDid),
  cid: await randomCid(),
  record: {
    $type: "app.bsky.graph.follow",
    subject: subjectDid,
    createdAt: new Date().toISOString(),
  },
  live: true,
});

const unfollowEvent = (actorDid: string, subjectDid: string): RecordEvent => ({
  id: 1,
  type: "record",
  action: "delete",
  did: asDid(actorDid),
  rev: nextRev(),
  collection: "app.bsky.graph.follow",
  rkey: rkeyOf(subjectDid),
  live: true,
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

describe("バックフィルの状態の確認", () => {
  const { ctx } = testSetup;

  const findBackfillStatus = async (did: string) => {
    const [actor] = await ctx.db
      .select({ backfillStatus: schema.actors.backfillStatus })
      .from(schema.actors)
      .where(eq(schema.actors.did, did));
    return actor?.backfillStatus;
  };

  test("backfill-1: Tapに登録したアカウントのバックフィルの状態を確認する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, runCheckBackfillJobs } =
      await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(subscriber.did, followee.did));
    await runSyncTapRepoJobs();
    await runCheckBackfillJobs();

    // assert
    expect(await findBackfillStatus(followee.did)).toBe("completed");
  });

  test("backfill-2: Tapの状態が error のときはエラー、pending・desynchronized・resyncing のときは取り込み中、それ以外は完了として保存する", async () => {
    // arrange
    const { checkBackfill, tapClient } = await setupJobTest();
    const expected = {
      error: "error",
      pending: "inProgress",
      desynchronized: "inProgress",
      resyncing: "inProgress",
      active: "completed",
      takendown: "completed",
      suspended: "completed",
      deactivated: "completed",
    };
    const actual: Record<string, string | null | undefined> = {};

    // act
    for (const state of Object.keys(expected)) {
      const subscriber = await actorFactory(ctx.db)
        .use((t) => t.subscriber())
        .create();
      tapClient.setRepoState(asDid(subscriber.did), state);
      await checkBackfill(asDid(subscriber.did));
      actual[state] = await findBackfillStatus(subscriber.did);
    }

    // assert
    expect(actual).toEqual(expected);
  });

  test("backfill-3: 完了でなければ、間隔を伸ばしながら確認を続ける", async () => {
    // arrange
    const { checkBackfill, tapClient, jobScheduler } = await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const did = asDid(subscriber.did);

    // act
    tapClient.setRepoState(did, "pending");
    await checkBackfill(did, 1);
    const jobsWhileInProgress = [...jobScheduler.getCheckBackfillJobs()];
    jobScheduler.clear();
    tapClient.setRepoState(did, "active");
    await checkBackfill(did, 2);

    // assert
    expect(jobsWhileInProgress).toEqual([{ did, attempt: 2 }]);
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-4: 追跡アクターでなくなったアカウントは確認しない", async () => {
    // arrange
    const { checkBackfill, jobScheduler } = await setupJobTest();
    const actor = await actorFactory(ctx.db).create();

    // act
    await checkBackfill(asDid(actor.did));

    // assert
    expect(await findBackfillStatus(actor.did)).toBeNull();
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-5: 起動時に、状態をまだ確認していない追跡アクターを確認する", async () => {
    // arrange
    const { indexCommit, scheduleBackfillChecks, jobScheduler } =
      await setupJobTest();
    const subscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(subscriber.did, followee.did));
    const checkedSubscriber = await actorFactory(ctx.db)
      .use((t) => t.subscriber())
      .props({ backfillStatus: () => "completed" })
      .create();
    const untracked = await actorFactory(ctx.db).create();
    jobScheduler.clear();

    // act
    await scheduleBackfillChecks();

    // assert
    const dids = jobScheduler.getCheckBackfillJobs().map((job) => job.did);
    expect(dids).toEqual(
      expect.arrayContaining([subscriber.did, followee.did]),
    );
    expect(dids).not.toContain(checkedSubscriber.did);
    expect(dids).not.toContain(untracked.did);
  });
});
