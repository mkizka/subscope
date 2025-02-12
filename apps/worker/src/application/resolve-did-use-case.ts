import type { Did } from "@atproto/did";
import { Actor, IDidResolver, type DatabaseClient } from "@dawn/common/domain";

import type { IActorRepository } from "./interfaces/actor-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["didResolver", "actorRepository", "db"] as const;

  async execute(did: Did) {
    const data = await this.didResolver.resolve(did);
    if (!data?.handle) {
      throw new Error(`Failed to resolve DID: ${did}`);
    }
    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor: new Actor({ did, handle: data.handle }),
    });
  }
}
