import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";

export class NotBannedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotBanned";
  }
}

export class UnbanActorUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly actorRepository: IActorRepository,
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const actor = await this.actorRepository.find(params.did);
    if (!actor?.isBanned) {
      throw new NotBannedError("Actor is not banned");
    }

    actor.unban();
    await this.actorRepository.save({ ctx: { db: this.db }, actor });
  }
}
