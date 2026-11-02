import type { Did } from "@atproto/did";
import {
  Actor,
  type IJobScheduler,
  type ITransactionManager,
  Subscription,
  type TransactionContext,
} from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";
import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";

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

export class BannedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Banned";
  }
}

type SubscribeServerParams = {
  actorDid: Did;
  code?: string;
};

export class SubscribeServerUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  private async useInviteCode(
    code: string | undefined,
    ctx: TransactionContext,
  ): Promise<void> {
    if (!code) {
      // 将来的には設定から招待コード不要にも出来るようにする
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const inviteCode = await this.inviteCodeRepository.find({ code, ctx });

    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCode.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }
    inviteCode.markAsUsed();
    await this.inviteCodeRepository.save({ inviteCode, ctx });
  }

  async execute({ actorDid, code }: SubscribeServerParams): Promise<void> {
    const existingSubscription =
      await this.subscriptionRepository.findFirst(actorDid);
    if (existingSubscription) {
      throw new AlreadySubscribedError("Already subscribed to this server");
    }

    const existingActor = await this.actorRepository.find(actorDid);
    if (existingActor?.isBanned) {
      throw new BannedError("Banned from this server");
    }

    await this.transactionManager.transaction(async (ctx) => {
      if (!existingActor?.isAdmin) {
        await this.useInviteCode(code, ctx);
      }

      if (!existingActor) {
        const actor = Actor.create({
          did: actorDid,
        });
        await this.actorRepository.save({ ctx, actor });
      }

      const subscription = new Subscription({
        actorDid,
        inviteCode: code,
        createdAt: new Date(),
      });
      await this.subscriptionRepository.save({ ctx, subscription });
    });

    await this.jobScheduler.scheduleSyncTapRepo(actorDid);
  }
}
