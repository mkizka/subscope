import assert from "node:assert";

import type { Did } from "@atproto/did";
import type { RecordEvent } from "@atproto/tap";
import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
} from "@repo/common/test";
import { testSetup } from "@repo/test-utils";

import type { LabelData } from "../application/interfaces/repositories/label-repository.js";
import { InMemoryLabelFetcher } from "../infrastructure/fetchers/label-fetcher.in-memory.js";
import { indexCommitCommandFactory } from "../presentation/tap.js";
import { createWorkerRegistry } from "./registry.js";
import { testEnv } from "./test-utils.js";

// prettier-ignore
const jobTestRegistry = createWorkerRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("tapClient", asClassArgs(InMemoryTapClient))
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("labelFetcher", asClassArgs(InMemoryLabelFetcher))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .replaceValue("syncWorker", {} as never);

export const setupJobTest = async () => {
  const services = await jobTestRegistry.resolve();
  const indexCommit = async (event: RecordEvent) => {
    const command = indexCommitCommandFactory(event);
    assert(command);
    await services.indexCommitUseCase.execute(command);
  };
  const runSyncTapRepoJobs = async () => {
    const jobs = [...services.jobScheduler.getSyncTapRepoJobs()];
    services.jobScheduler.clear();
    for (const { did } of jobs) {
      await services.syncTapRepoUseCase.execute(did);
    }
  };
  const runCheckBackfillJobs = async () => {
    const jobs = [...services.jobScheduler.getCheckBackfillJobs()];
    services.jobScheduler.clear();
    for (const job of jobs) {
      await services.checkBackfillUseCase.execute(job);
    }
  };
  return {
    indexCommit,
    runSyncTapRepoJobs,
    runCheckBackfillJobs,
    scheduleBackfillChecks: () =>
      services.scheduleBackfillChecksUseCase.execute(),
    jobScheduler: services.jobScheduler,
    syncTapRepo: (did: Did) => services.syncTapRepoUseCase.execute(did),
    checkBackfill: (did: Did, attempt = 0) =>
      services.checkBackfillUseCase.execute({ did, attempt }),
    indexLabel: (label: LabelData) => services.indexLabelUseCase.execute(label),
    tapClient: services.tapClient,
    labelFetcher: services.labelFetcher,
  };
};
