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

describe("Tapへの追加", () => {
  const { ctx } = testSetup;

  test("tap-11: 登録されたアカウントをTapに追加する", async () => {
    // arrange
    const { syncAccountKind, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    await syncAccountKind(asDid(serverMember.did));

    // assert
    expect(tapClient.getAddedDids()).toEqual([serverMember.did]);
  });

  test("tap-12: メンバーがフォローしたアカウントはTapに追加しない", async () => {
    // arrange
    const { indexCommit, runSyncAccountKindJobs, tapClient } =
      await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();

    // act
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await runSyncAccountKindJobs();

    // assert
    expect(tapClient.getAddedDids()).not.toContain(followee.did);
  });

  test("tap-13: 登録を解除されたアカウントをTapから外す", async () => {
    // arrange
    const { syncAccountKind, tapClient } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    await syncAccountKind(asDid(serverMember.did));
    await ctx.db
      .delete(schema.registrations)
      .where(eq(schema.registrations.accountDid, serverMember.did));

    // act
    await syncAccountKind(asDid(serverMember.did));

    // assert
    expect(tapClient.getAddedDids()).toEqual([]);
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
    const { syncAccountKind, runCheckBackfillJobs } = await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();

    // act
    await syncAccountKind(asDid(serverMember.did));
    await runCheckBackfillJobs();

    // assert
    expect(await findBackfillStatus(serverMember.did)).toBe("completed");
  });

  test("backfill-2: Tapの状態を、エラー・同期中・完了のどれかに分けて保存する", async () => {
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

  test("backfill-4: メンバーでなくなったアカウントは確認しない", async () => {
    // arrange
    const { checkBackfill, jobScheduler } = await setupJobTest();
    const account = await accountFactory(ctx.db).create();

    // act
    await checkBackfill(asDid(account.did));

    // assert
    expect(await findBackfillStatus(account.did)).toBeNull();
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-6: リレーが削除済みと答えるエラーのアカウントは、Tapから外して完了とし、確認を止める", async () => {
    // arrange
    const { checkBackfill, tapClient, repoStatusFetcher, jobScheduler } =
      await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const did = asDid(serverMember.did);
    await tapClient.addRepo(did);
    tapClient.setRepoState(did, "error");
    repoStatusFetcher.setDeleted(did);

    // act
    await checkBackfill(did, 1);

    // assert
    expect(await findBackfillStatus(did)).toBe("completed");
    expect(tapClient.getAddedDids()).toEqual([]);
    expect(jobScheduler.getCheckBackfillJobs()).toEqual([]);
  });

  test("backfill-5: 起動時に、状態をまだ確認していないメンバーを確認する", async () => {
    // arrange
    const { indexCommit, scheduleBackfillChecks, jobScheduler } =
      await setupJobTest();
    const serverMember = await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .create();
    const followee = await accountFactory(ctx.db).create();
    await indexCommit(await followEvent(serverMember.did, followee.did));
    await accountFactory(ctx.db)
      .use((t) => t.serverMember())
      .props({ backfillStatus: () => "completed" })
      .create();
    jobScheduler.clear();

    // act
    await scheduleBackfillChecks();

    // assert
    const dids = jobScheduler.getCheckBackfillJobs().map((job) => job.did);
    expect(dids).toEqual([serverMember.did]);
  });
});
