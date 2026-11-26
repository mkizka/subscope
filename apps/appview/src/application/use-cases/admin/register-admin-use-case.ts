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
    private readonly deps: {
      transactionManager: ITransactionManager;
      accountQuery: IAccountQuery;
      createAdminService: CreateAdminService;
      createRegistrationService: CreateRegistrationService;
    },
  ) {}

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.deps.accountQuery.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    await this.deps.transactionManager.transaction(async (ctx) => {
      await this.deps.createAdminService.create({
        ctx,
        did: params.requesterDid,
      });
      await this.deps.createRegistrationService.create({
        ctx,
        accountDid: params.requesterDid,
      });
    });
  }
}
