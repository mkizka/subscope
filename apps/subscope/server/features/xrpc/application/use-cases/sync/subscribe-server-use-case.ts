import type { Did } from "@atproto/did";
import type { InviteCode } from "@repo/common/domain";
import {
  Actor,
  type IJobScheduler,
  type ITransactionManager,
  Subscription,
} from "@repo/common/domain";

import type { IActorRepository } from "@/server/features/xrpc/application/interfaces/actor-repository.js";
import type { IInviteCodeRepository } from "@/server/features/xrpc/application/interfaces/invite-code-repository.js";
import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";

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
  static inject = [
    "transactionManager",
    "actorRepository",
    "inviteCodeRepository",
    "subscriptionRepository",
    "jobScheduler",
  ] as const;

  private async validateInviteCode(
    code: string | undefined,
    isAdmin: boolean = false,
  ): Promise<InviteCode | null> {
    if (isAdmin) {
      return null;
    }
    if (!code) {
      // 将来的には設定から招待コード不要にも出来るようにする
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const inviteCode = await this.inviteCodeRepository.findFirst(code);

    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCode.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }
    return inviteCode;
  }

  async execute({ actorDid, code }: SubscribeServerParams): Promise<void> {
    const existingSubscription =
      await this.subscriptionRepository.findFirst(actorDid);
    if (existingSubscription) {
      throw new AlreadySubscribedError("Already subscribed to this server");
    }

    const existingActor = await this.actorRepository.findByDid(actorDid);
    const inviteCode = await this.validateInviteCode(
      code,
      existingActor?.isAdmin,
    );

    await this.transactionManager.transaction(async (ctx) => {
      if (!existingActor) {
        const actor = Actor.create({
          did: actorDid,
        });
        await this.actorRepository.upsert({ ctx, actor });
      }

      const subscription = new Subscription({
        actorDid,
        inviteCode: code,
        createdAt: new Date(),
      });
      await this.subscriptionRepository.save({ ctx, subscription });

      if (inviteCode) {
        inviteCode.markAsUsed();
        await this.inviteCodeRepository.upsert({ ctx, inviteCode });
      }
    });

    await this.jobScheduler.scheduleAddTapRepo(actorDid);
  }
}
