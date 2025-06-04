import type { Did } from "@atproto/did";
import {
  Actor,
  type IJobQueue,
  type TransactionContext,
} from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["actorRepository", "jobQueue"] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }) {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });
    const actor = new Actor({ did, handle });
    if (existingActor) {
      // インデックスされた時点からhandleが変更されていれば更新
      if (handle && existingActor.handle !== handle) {
        await this.actorRepository.upsert({ ctx, actor });
        return;
      }
      // インデックス済みのactorがhandleを持っていなければ解決を予約
      if (!existingActor.handle) {
        await this.scheduleResolveDid(did);
        return;
      }
      // ハンドルを変更も新規解決もする必要がなければ何もしない
      return;
    }
    // インデックスされていない場合は新規登録
    await this.actorRepository.upsert({ ctx, actor });
    if (!handle) {
      await this.scheduleResolveDid(did);
    }
  }

  private async scheduleResolveDid(did: Did) {
    await this.jobQueue.add({
      queueName: "resolveDid",
      jobName: `at://${did}`,
      data: did,
    });
  }
}
