import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";
import type { FetchRecordScheduler } from "./scheduler/fetch-record-scheduler.js";
import type { ResolveDidScheduler } from "./scheduler/resolve-did-scheduler.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly fetchRecordScheduler: FetchRecordScheduler,
    private readonly resolveDidScheduler: ResolveDidScheduler,
  ) {}
  static inject = [
    "actorRepository",
    "profileRepository",
    "fetchRecordScheduler",
    "resolveDidScheduler",
  ] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }): Promise<void> {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    if (existingActor) {
      // インデックスされたactorのhandleと異なるhandleが指定された場合は更新
      if (handle && existingActor.handle !== handle) {
        await this.actorRepository.updateHandle({ ctx, did, handle });
      }
      // インデックスされたactorがhandleを持っていなければresolveする
      if (!existingActor.handle) {
        await this.resolveDidScheduler.schedule(did);
      }
    } else {
      // インデックスされていない場合は新規登録
      const actor = new Actor({ did, handle });
      await this.actorRepository.upsert({ ctx, actor });

      // handleが無い場合はresolveする
      if (!handle) {
        await this.resolveDidScheduler.schedule(did);
      }
    }

    // profileが存在しない場合はfetchRecordジョブを追加
    const profileExists = await this.profileRepository.exists({
      ctx,
      actorDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.fetchRecordScheduler.schedule(profileUri, 0);
    }
  }
}
