import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";
import type { CreateAdminService } from "../../service/admin/create-admin-service.js";

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
    private readonly createAdminService: CreateAdminService,
  ) {}
  static inject = ["db", "actorRepository", "createAdminService"] as const;

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.actorRepository.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    await this.createAdminService.execute({
      ctx: { db: this.db },
      did: params.requesterDid,
    });
  }
}
