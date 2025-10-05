import type { Did } from "@atproto/did";
import { Subscription } from "@repo/common/domain";

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
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly backfillScheduler: BackfillScheduler,
  ) {}
  static inject = [
    "inviteCodeRepository",
    "subscriptionRepository",
    "backfillScheduler",
  ] as const;

  async execute(params: SubscribeServerParams): Promise<void> {
    // 将来的には設定から招待コード不要にも出来るようにする
    if (!params.inviteCode) {
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const existingSubscription = await this.subscriptionRepository.findFirst(
      params.actorDid,
    );
    if (existingSubscription) {
      throw new AlreadySubscribedError("Already subscribed to this server");
    }

    const inviteCode = await this.inviteCodeRepository.findFirst(
      params.inviteCode,
    );
    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCode.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }

    const subscription = new Subscription({
      actorDid: params.actorDid,
      inviteCode: params.inviteCode,
      createdAt: new Date(),
    });

    await this.subscriptionRepository.save(subscription);
    await this.inviteCodeRepository.markAsUsed(params.inviteCode);
    await this.backfillScheduler.schedule(params.actorDid);
  }
}
