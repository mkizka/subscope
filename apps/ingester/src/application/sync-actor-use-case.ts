import type { Did } from "@atproto/api";
import type { DatabaseClient } from "@dawn/common/domain";
import { Actor } from "@dawn/common/domain";

import type { IActorRepository } from "./interfaces/actor-repository.js";
import type { IDidResolver } from "./interfaces/did-resolver.js";

export class SyncActorUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly didResolver: IDidResolver,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["actorRepository", "didResolver", "db"] as const;

  async execute(dto: { did: Did; handle?: string }) {
    let handle = dto.handle;
    if (!handle) {
      const data = await this.didResolver.resolve(dto.did);
      handle = data?.handle;
    }
    const actor = new Actor({ did: dto.did, handle });
    await this.actorRepository.createOrUpdate({ ctx: { db: this.db }, actor });
  }
}
