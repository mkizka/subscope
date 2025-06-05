import type { Did } from "@atproto/did";
import { Actor, type TransactionContext } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";

export interface ActorUpsertResult {
  shouldResolveDid: boolean;
  shouldBackfill: boolean;
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
      // インデックスされた時点からhandleが変更されていれば更新
      if (handle && existingActor.handle !== handle) {
        await this.actorRepository.updateHandle({ ctx, did, handle });
        return {
          shouldResolveDid: false,
          shouldBackfill: false,
        };
      }
      // インデックス済みのactorがhandleを持っていなければ解決を予約
      if (!existingActor.handle) {
        return {
          shouldResolveDid: true,
          shouldBackfill: false,
        };
      }
      // ハンドルを変更も新規解決もする必要がなければ何もしない
      return {
        shouldResolveDid: false,
        shouldBackfill: false,
      };
    }

    // インデックスされていない場合は新規登録
    const actor = new Actor({ did, handle });
    await this.actorRepository.upsert({ ctx, actor });

    return {
      shouldResolveDid: !handle,
      shouldBackfill: actor.backfillStatus === "dirty",
    };
  }
}
