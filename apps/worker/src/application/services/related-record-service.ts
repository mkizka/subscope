import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { Origin } from "../../domain/origin.js";
import type { StoragePolicy } from "../../domain/services/storage-policy.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IRecordQuery } from "../interfaces/queries/record-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

export class RelatedRecordService {
  constructor(
    private readonly deps: {
      recordQuery: IRecordQuery;
      profileQuery: IProfileQuery;
      accountRepository: IAccountRepository;
      jobScheduler: IJobScheduler;
      storagePolicy: StoragePolicy;
    },
  ) {}

  async requestFor({
    ctx,
    origin,
    record,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    record: Parameters<StoragePolicy["recordsToFetch"]>[0]["record"];
  }) {
    const dids = await this.deps.storagePolicy.accountsToFetch({ ctx, record });
    for (const did of dids) {
      await this.requestAccount({ ctx, origin, did });
    }
    const uris = await this.deps.storagePolicy.recordsToFetch({
      ctx,
      origin,
      record,
    });
    for (const uri of uris) {
      await this.request({ ctx, origin, uri });
    }
  }

  async request({
    ctx,
    origin,
    uri,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    uri: AtUri | null;
  }) {
    if (!uri || !origin.canFetchRelated) {
      return;
    }
    const saved = await this.deps.recordQuery.exists(ctx, uri);
    if (saved) {
      return;
    }
    ctx.afterCommit(() =>
      this.deps.jobScheduler.scheduleFetchRecord(uri, origin.jobOptions),
    );
  }

  async requestAccount({
    ctx,
    origin,
    did,
  }: {
    ctx: AfterCommitContext;
    origin: Origin;
    did: Did;
  }) {
    const { live } = origin.jobOptions;
    const account = await this.deps.accountRepository.find({ ctx, did });
    if (!account?.handle) {
      ctx.afterCommit(() =>
        this.deps.jobScheduler.scheduleResolveDid(did, { live }),
      );
    }
    const hasProfile = await this.deps.profileQuery.exists({
      ctx,
      accountDid: did,
    });
    if (!hasProfile) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      ctx.afterCommit(() =>
        this.deps.jobScheduler.scheduleFetchRecord(profileUri, {
          live,
          depth: 0,
        }),
      );
    }
  }
}
