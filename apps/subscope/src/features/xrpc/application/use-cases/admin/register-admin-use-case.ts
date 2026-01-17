import type { Did } from "@atproto/did";
import { Actor, type DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";

export class AdminAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAlreadyExists";
  }
}

type RegisterAdminParams = {
  requesterDid: Did;
};

export class RegisterAdminUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly actorRepository: IActorRepository,
  ) {}
  static inject = ["db", "actorRepository"] as const;

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.actorRepository.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    let actor = await this.actorRepository.findByDid(params.requesterDid);
    if (!actor) {
      actor = Actor.create({ did: params.requesterDid });
    }

    actor.promoteToAdmin();
    await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
  }
}
