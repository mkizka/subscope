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

  test("tap-1: 登録アカウントがフォローしたアカウントをTapに追加する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-2: 登録アカウント以外のフォローではTapに追加しない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const nonRegisteredAccount = await actorFactory(ctx.db).create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(
      await followEvent(nonRegisteredAccount.did, followee.did),
    );
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-3: 登録アカウントがフォローを外したアカウントは、追跡アカウントでなくなればTapから外す", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(registeredAccount.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-4: 他の登録アカウントがフォローしているアカウントはTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const otherRegisteredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    await indexCommit(
      await followEvent(otherRegisteredAccount.did, followee.did),
    );
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(registeredAccount.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-5: 登録アカウント以外がフォローを外してもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const nonRegisteredAccount = await actorFactory(ctx.db).create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    await indexCommit(
      await followEvent(nonRegisteredAccount.did, followee.did),
    );
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(nonRegisteredAccount.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-6: 登録アカウントは、フォローを外されてもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followedRegisteredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    await indexCommit(
      await followEvent(registeredAccount.did, followedRegisteredAccount.did),
    );
    await runSyncTapRepoJobs();

    // act
    await indexCommit(
      unfollowEvent(registeredAccount.did, followedRegisteredAccount.did),
    );
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(
      followedRegisteredAccount.did,
    );
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

  test("backfill-1: Tapに追加したアカウントのバックフィルの状態を確認する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, runCheckBackfillJobs } =
      await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await actorFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    await runSyncTapRepoJobs();
    await runCheckBackfillJobs();

    // assert
    expect(await findBackfillStatus(followee.did)).toBe("completed");
  });

  test("backfill-2: Tapの状態が error のときはエラー、pending・desynchronized・resyncing のときは同期中、それ以外は完了として保存する", async () => {
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
      const registeredAccount = await actorFactory(ctx.db)
        .use((t) => t.registeredAccount())
        .create();
      tapClient.setRepoState(asDid(registeredAccount.did), state);
      await checkBackfill(asDid(registeredAccount.did));
      actual[state] = await findBackfillStatus(registeredAccount.did);
    }

    // assert
    expect(actual).toEqual(expected);
  });

  test("backfill-3: 完了でなければ、間隔を伸ばしながら確認を続ける", async () => {
    // arrange
    const { checkBackfill, tapClient, jobScheduler } = await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const did = asDid(registeredAccount.did);

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

  test("backfill-4: 追跡アカウントでなくなったアカウントは確認しない", async () => {
    // arrange
    const { checkBackfill, jobScheduler } = await setupJobTest();
    const actor = await actorFactory(ctx.db).create();

    // act
    await checkBackfill(asDid(actor.did));

    // assert
    expect(await findBackfillStatus(actor.did)).toBeNull();
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-5: 起動時に、状態をまだ確認していない追跡アカウントを確認する", async () => {
    // arrange
    const { indexCommit, scheduleBackfillChecks, jobScheduler } =
      await setupJobTest();
    const registeredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .create();
    const followee = await actorFactory(ctx.db).create();
    await indexCommit(await followEvent(registeredAccount.did, followee.did));
    const checkedRegisteredAccount = await actorFactory(ctx.db)
      .use((t) => t.registeredAccount())
      .props({ backfillStatus: () => "completed" })
      .create();
    const untracked = await actorFactory(ctx.db).create();
    jobScheduler.clear();

    // act
    await scheduleBackfillChecks();

    // assert
    const dids = jobScheduler.getCheckBackfillJobs().map((job) => job.did);
    expect(dids).toEqual(
      expect.arrayContaining([registeredAccount.did, followee.did]),
    );
    expect(dids).not.toContain(checkedRegisteredAccount.did);
    expect(dids).not.toContain(untracked.did);
  });
});
