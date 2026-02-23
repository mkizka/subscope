import type { Did } from "@atproto/did";
import {
  type IJobScheduler,
  type ITransactionManager,
  Subscription,
} from "@repo/common/domain";

import type { IActorRepository } from "@/server/features/xrpc/application/interfaces/actor-repository.js";
import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";
import type { CreateAdminService } from "@/server/features/xrpc/application/service/admin/create-admin-service.js";

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
    private readonly actorRepository: IActorRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly createAdminService: CreateAdminService,
    private readonly jobScheduler: IJobScheduler,
  ) {}
  static inject = [
    "transactionManager",
    "actorRepository",
    "subscriptionRepository",
    "createAdminService",
    "jobScheduler",
  ] as const;

  async execute(params: RegisterAdminParams): Promise<void> {
    const hasAnyAdmin = await this.actorRepository.hasAnyAdmin();
    if (hasAnyAdmin) {
      throw new AdminAlreadyExistsError("Admin already exists");
    }

    await this.transactionManager.transaction(async (ctx) => {
      await this.createAdminService.execute({
        ctx,
        did: params.requesterDid,
      });

      const subscription = new Subscription({
        actorDid: params.requesterDid,
        createdAt: new Date(),
      });
      await this.subscriptionRepository.save({ ctx, subscription });
    });

    await this.jobScheduler.scheduleAddTapRepo(params.requesterDid);
  }
}
