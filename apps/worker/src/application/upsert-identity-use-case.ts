import type { DatabaseClient, TransactionContext } from "@dawn/common/domain";

import type { ISubscriptionRepository } from "./interfaces/subscription-repository.js";
import type { IndexActorService } from "./service/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly indexActorService: IndexActorService,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "db",
    "indexActorService",
    "subscriptionRepository",
  ] as const;

  async execute(command: UpsertIdentityCommand) {
    if (!command.handle) {
      return;
    }
    const ctx = { db: this.db };
    const shouldIndex = await this.shouldIndexActor(ctx, command.did);
    if (!shouldIndex) {
      return;
    }
    await this.indexActorService.upsert({
      ctx,
      did: command.did,
      handle: command.handle,
    });
  }

  private async shouldIndexActor(
    ctx: TransactionContext,
    did: string,
  ): Promise<boolean> {
    // subscriberであるか、subscriberのフォロワーがいるactorのみインデックス
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      did,
    );
    if (isSubscriber) {
      return true;
    }
    return this.subscriptionRepository.hasSubscriberFollower(ctx, did);
  }
}
