import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";
import { Profile } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";
import type { IProfileRecordFetcher } from "../../interfaces/external/profile-record-fetcher.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../../interfaces/repositories/record-repository.js";

export class FetchProfileUseCase {
  constructor(
    private readonly profileRecordFetcher: IProfileRecordFetcher,
    private readonly actorRepository: IActorRepository,
    private readonly recordRepository: IRecordRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}
  static inject = [
    "profileRecordFetcher",
    "recordRepository",
    "profileRepository",
    "actorRepository",
    "transactionManager",
  ] as const;

  async execute({
    did,
    jobLogger,
  }: {
    did: Did;
    jobLogger: JobLogger;
  }): Promise<void> {
    const record = await this.profileRecordFetcher.fetch(did);
    if (!record) {
      await jobLogger.log(`Profile not found for DID: ${did}`);
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      // indexCommitServiceから呼ばれるジョブなのでActorが存在する前提だが、
      // actorの作成完了前にこのジョブが実行された場合actorが必要なので作成する
      await this.actorRepository.createIfNotExists({ ctx, did });
      await this.recordRepository.upsert({ ctx, record });
      await this.profileRepository.upsert({
        ctx,
        profile: Profile.from(record),
      });
    });
  }
}
