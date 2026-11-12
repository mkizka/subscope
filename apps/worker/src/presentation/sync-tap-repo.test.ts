import { asDid } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { schema } from "@repo/db";
import { accountFactory, randomCid, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { setupJobTest } from "../shared/job-test-utils.js";

let revCount = 0;
const nextRev = () => String(++revCount).padStart(13, "0");

const rkeyOf = (subjectDid: string) => subjectDid.replaceAll(":", "-");

const followEvent = async (
  accountDid: string,
  subjectDid: string,
): Promise<RecordEvent> => ({
  id: 1,
  type: "record",
  action: "create",
  did: asDid(accountDid),
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

const unfollowEvent = (
  accountDid: string,
  subjectDid: string,
): RecordEvent => ({
  id: 1,
  type: "record",
  action: "delete",
  did: asDid(accountDid),
  rev: nextRev(),
  collection: "app.bsky.graph.follow",
  rkey: rkeyOf(subjectDid),
  live: true,
});

describe("Tapへの登録", () => {
  const { ctx } = testSetup;

  test("tap-1: メンバーがフォローしたアカウントをTapに追加する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-2: メンバー以外のフォローではTapに追加しない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const nonServerMember = await accountFactory(ctx.db).create();
    const followee = await accountFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(nonServerMember.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-3: メンバーがフォローを外したアカウントは、追跡アカウントでなくなればTapから外す", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(serverMember.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).not.toContain(followee.did);
  });

  test("tap-4: 他のメンバーがフォローしているアカウントはTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const otherServerMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await indexCommit(await followEvent(otherServerMember.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(serverMember.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-5: メンバー以外がフォローを外してもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const nonServerMember = await accountFactory(ctx.db).create();
    const followee = await accountFactory(ctx.db).create();
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await indexCommit(await followEvent(nonServerMember.did, followee.did));
    await runSyncTapRepoJobs();

    // act
    await indexCommit(unfollowEvent(nonServerMember.did, followee.did));
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followee.did);
  });

  test("tap-6: メンバーはフォローを外されてもTapから外さない", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followedServerMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    await indexCommit(
      await followEvent(serverMember.did, followedServerMember.did),
    );
    await runSyncTapRepoJobs();

    // act
    await indexCommit(
      unfollowEvent(serverMember.did, followedServerMember.did),
    );
    await runSyncTapRepoJobs();

    // assert
    expect(tapClient.getRegisteredDids()).toContain(followedServerMember.did);
  });
});

describe("バックフィルの状態の確認", () => {
  const { ctx } = testSetup;

  const findBackfillStatus = async (did: string) => {
    const [account] = await ctx.db
      .select({ backfillStatus: schema.accounts.backfillStatus })
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did));
    return account?.backfillStatus;
  };

  test("backfill-1: Tapに追加したアカウントのバックフィルの状態を確認する", async () => {
    // arrange
    const { indexCommit, runSyncTapRepoJobs, runCheckBackfillJobs } =
      await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(serverMember.did, followee.did));
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
      const serverMember = await accountFactory(ctx.db)
        .use((t) => t.serverMember())
        .create();
      tapClient.setRepoState(asDid(serverMember.did), state);
      await checkBackfill(asDid(serverMember.did));
      actual[state] = await findBackfillStatus(serverMember.did);
    }

    // assert
    expect(actual).toEqual(expected);
  });

  test("backfill-3: 完了でなければ、間隔を伸ばしながら確認を続ける", async () => {
    // arrange
    const { checkBackfill, tapClient, jobScheduler } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const did = asDid(serverMember.did);

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
    const account = await accountFactory(ctx.db).create();

    // act
    await checkBackfill(asDid(account.did));

    // assert
    expect(await findBackfillStatus(account.did)).toBeNull();
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-5: 起動時に、状態をまだ確認していない追跡アカウントを確認する", async () => {
    // arrange
    const { indexCommit, scheduleBackfillChecks, jobScheduler } =
      await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await indexCommit(await followEvent(serverMember.did, followee.did));
    const checkedServerMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .props({ backfillStatus: () => "completed" })
      .create();
    const untracked = await accountFactory(ctx.db).create();
    jobScheduler.clear();

    // act
    await scheduleBackfillChecks();

    // assert
    const dids = jobScheduler.getCheckBackfillJobs().map((job) => job.did);
    expect(dids).toEqual(
      expect.arrayContaining([serverMember.did, followee.did]),
    );
    expect(dids).not.toContain(checkedServerMember.did);
    expect(dids).not.toContain(untracked.did);
  });
});
