import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { AtpBaseClient } from "@dawn/client/api";
import type {
  IDidResolver,
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";
import { Profile, Record } from "@dawn/common/domain";

import type { JobLogger } from "../shared/job.js";
import type { FetchProfileCommand } from "./fetch-profile-command.js";
import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class FetchProfileUseCase {
  static inject = [
    "didResolver",
    "profileRepository",
    "transactionManager",
  ] as const;

  constructor(
    private readonly didResolver: IDidResolver,
    private readonly profileRepository: IProfileRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(command: FetchProfileCommand): Promise<void> {
    const { did, jobLogger } = command;

    await jobLogger.log(`Fetching profile for ${did}`);

    await this.transactionManager.transaction(async (ctx) => {
      await this.fetchProfile(ctx, did, jobLogger);
    });
  }

  private async fetchProfile(
    ctx: TransactionContext,
    did: Did,
    jobLogger: JobLogger,
  ): Promise<void> {
    // DIDからPDSを解決
    const { pds } = await this.didResolver.resolve(did);
    const client = new AtpBaseClient(pds);

    // プロファイルレコードを取得
    const response = await client.com.atproto.repo.getRecord({
      repo: did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
    });

    if (!response.success) {
      await jobLogger.log(`Profile not found for ${did}`);
      return;
    }

    const profileUri = new AtUri(response.data.uri);
    const cid = response.data.cid;
    if (!cid) {
      await jobLogger.log(`No CID in profile response for ${did}`);
      return;
    }

    const record = Record.fromJson({
      uri: profileUri,
      cid,
      json: response.data.value,
    });

    const profile = Profile.from(record);

    await this.profileRepository.upsert({ ctx, profile });

    await jobLogger.log(`Successfully fetched profile for ${did}`);
  }
}
