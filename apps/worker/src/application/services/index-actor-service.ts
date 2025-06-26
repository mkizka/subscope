import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { Actor, type TransactionContext } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

import type { IActorRepository } from "../interfaces/repositories/actor-repository.js";
import type { IProfileRepository } from "../interfaces/repositories/profile-repository.js";
import type { FetchRecordService } from "./scheduler/fetch-record-service.js";
import type { ResolveDidService } from "./scheduler/resolve-did-service.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly fetchRecordService: FetchRecordService,
    private readonly resolveDidService: ResolveDidService,
  ) {}
  static inject = [
    "actorRepository",
    "profileRepository",
    "fetchRecordService",
    "resolveDidService",
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
        await this.resolveDidService.schedule(did);
      }
    } else {
      // インデックスされていない場合は新規登録
      const actor = new Actor({ did, handle });
      await this.actorRepository.upsert({ ctx, actor });

      // handleが無い場合はresolveする
      if (!handle) {
        await this.resolveDidService.schedule(did);
      }
    }

    // profileが存在しない場合はfetchRecordジョブを追加
    const profileExists = await this.profileRepository.exists({
      ctx,
      actorDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.fetchRecordService.schedule(profileUri);
    }
  }
}
