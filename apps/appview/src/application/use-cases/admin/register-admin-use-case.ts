import type { Did } from "@atproto/did";
import { type ITransactionManager } from "@repo/common/interface";

import type { CreateAdminService } from "../../../application/service/admin/create-admin-service.js";
import type { IAccountQuery } from "../../interfaces/queries/account-query.js";
import type { CreateRegistrationService } from "../../service/sync/create-registration-service.js";

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
    private readonly accountQuery: IAccountQuery,
    private readonly createAdminService: CreateAdminService,
    private readonly createRegistrationService: CreateRegistrationService,
  ) {}

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.accountQuery.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    await this.transactionManager.transaction(async (ctx) => {
      await this.createAdminService.create({
        ctx,
        did: params.requesterDid,
      });
      await this.createRegistrationService.create({
        ctx,
        accountDid: params.requesterDid,
      });
    });
  }
}
