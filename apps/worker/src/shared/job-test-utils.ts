import type { Did } from "@atproto/did";
import { asClassArgs } from "@gyaku/di";
import type { CommitEventDto, JobData } from "@repo/common/domain";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
  InMemoryTapClient,
} from "@repo/common/test";
import { testSetup } from "@repo/test-utils";

import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import { InMemoryLabelFetcher } from "../infrastructure/fetchers/label-fetcher.in-memory.js";
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
  const indexCommit = async (event: CommitEventDto) => {
    const command = indexCommitCommandFactory({
      event,
      jobLogger: { log: () => Promise.resolve(0) },
    });
    await services.indexCommitUseCase.execute(command);
  };
  const runSyncTapRepoJobs = async () => {
    for (const { did } of services.jobScheduler.getSyncTapRepoJobs()) {
      await services.syncTapRepoUseCase.execute(did);
    }
    services.jobScheduler.clear();
  };
  return {
    indexCommit,
    runSyncTapRepoJobs,
    syncTapRepo: (did: Did) => services.syncTapRepoUseCase.execute(did),
    indexLabel: (label: JobData["label"]) =>
      services.indexLabelUseCase.execute(label),
    tapClient: services.tapClient,
    labelFetcher: services.labelFetcher,
  };
};
