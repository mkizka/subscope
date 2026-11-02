import type { Did } from "@atproto/did";
import {
  type IJobScheduler,
  type ITransactionManager,
  Registration,
} from "@repo/common/domain";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import type { CreateAdminService } from "../../../application/service/admin/create-admin-service.js";
import type { IActorQuery } from "../../interfaces/queries/actor-query.js";

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
    private readonly transactionManager: ITransactionManager,
    private readonly actorQuery: IActorQuery,
    private readonly registrationRepository: IRegistrationRepository,
    private readonly createAdminService: CreateAdminService,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.actorQuery.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    await this.transactionManager.transaction(async (ctx) => {
      await this.createAdminService.execute({
        ctx,
        did: params.requesterDid,
      });

      const registration = new Registration({
        actorDid: params.requesterDid,
        createdAt: new Date(),
      });
      await this.registrationRepository.save({ ctx, registration });
    });

    await this.jobScheduler.scheduleSyncTapRepo(params.requesterDid);
  }
}
