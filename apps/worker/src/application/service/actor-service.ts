import type { Did } from "@atproto/did";
import { Actor, type TransactionContext } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";

export interface ActorUpsertResult {
  shouldResolveDid: boolean;
}

export class ActorService {
  constructor(private readonly actorRepository: IActorRepository) {}
  static inject = ["actorRepository"] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }): Promise<ActorUpsertResult> {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    if (existingActor) {
      // インデックスされたactorのhandleと異なるhandleが指定された場合は更新
      if (handle && existingActor.handle !== handle) {
        await this.actorRepository.updateHandle({ ctx, did, handle });
        return {
          shouldResolveDid: false,
        };
      }
      // インデックスされたactorがhandleを持っていなければ解決
      if (!existingActor.handle) {
        return {
          shouldResolveDid: true,
        };
      }
      // それ以外は何もしない
      return {
        shouldResolveDid: false,
      };
    }
    // インデックスされていない場合は新規登録
    const actor = new Actor({ did, handle });
    await this.actorRepository.upsert({ ctx, actor });
    return {
      shouldResolveDid: !handle,
    };
  }
}
