import type { Did } from "@atproto/did";
import { type ITransactionManager, Subscription } from "@repo/common/domain";

import type { IInviteCodeRepository } from "./interfaces/invite-code-repository.js";
import type { ISubscriptionRepository } from "./interfaces/subscription-repository.js";
import type { BackfillScheduler } from "./service/scheduler/backfill-scheduler.js";

export class InvalidInviteCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInviteCode";
  }
}

export class AlreadySubscribedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadySubscribed";
  }
}

type SubscribeServerParams = {
  actorDid: Did;
  inviteCode?: string;
};

export class SubscribeServerUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly backfillScheduler: BackfillScheduler,
  ) {}
  static inject = [
    "transactionManager",
    "inviteCodeRepository",
    "subscriptionRepository",
    "backfillScheduler",
  ] as const;

  async execute({
    actorDid,
    inviteCode,
  }: SubscribeServerParams): Promise<void> {
    // 将来的には設定から招待コード不要にも出来るようにする
    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const existingSubscription =
      await this.subscriptionRepository.findFirst(actorDid);
    if (existingSubscription) {
      throw new AlreadySubscribedError("Already subscribed to this server");
    }

    const inviteCodeEntity =
      await this.inviteCodeRepository.findFirst(inviteCode);
    if (!inviteCodeEntity) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCodeEntity.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }

    const subscription = new Subscription({
      actorDid,
      inviteCode,
      createdAt: new Date(),
    });

    await this.transactionManager.transaction(async (ctx) => {
      await this.subscriptionRepository.save({ ctx, subscription });
      await this.inviteCodeRepository.markAsUsed({
        ctx,
        code: inviteCode,
      });
    });
    await this.backfillScheduler.schedule(actorDid);
  }
}
