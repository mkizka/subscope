import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";
import type { IndexActorService } from "../../service/actor/index-actor-service.js";

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
    private readonly indexActorService: IndexActorService,
  ) {}
  static inject = ["db", "actorRepository", "indexActorService"] as const;

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.actorRepository.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    const actor = await this.indexActorService.upsert({
      ctx: { db: this.db },
      did: params.requesterDid,
    });

    actor.promoteToAdmin();
    await this.actorRepository.upsert({ ctx: { db: this.db }, actor });
  }
}
