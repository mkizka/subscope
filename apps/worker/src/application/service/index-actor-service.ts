import type { Did } from "@atproto/did";
import { Actor, type TransactionContext } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { ResolveDidService } from "./resolve-did-service.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly resolveDidService: ResolveDidService,
  ) {}
  static inject = ["actorRepository", "resolveDidService"] as const;

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
        return;
      }
      // インデックスされたactorがhandleを持っていなければresolveする
      if (!existingActor.handle) {
        await this.resolveDidService.schedule(did);
      }
      return;
    }
    // インデックスされていない場合は新規登録
    const actor = new Actor({ did, handle });
    await this.actorRepository.upsert({ ctx, actor });

    // handleが無い場合はresolveする
    if (!handle) {
      await this.resolveDidService.schedule(did);
    }
  }
}
