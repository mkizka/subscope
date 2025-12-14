import type { Did } from "@atproto/did";
import {
  Actor,
  type ITransactionManager,
  Subscription,
} from "@repo/common/domain";

import type { IActorRepository } from "./interfaces/actor-repository.js";
import type { IInviteCodeRepository } from "./interfaces/invite-code-repository.js";
import type { ISubscriptionRepository } from "./interfaces/subscription-repository.js";
import type { SyncRepoScheduler } from "./service/scheduler/sync-repo-scheduler.js";

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
    private readonly syncRepoScheduler: SyncRepoScheduler,
  ) {}
  static inject = [
    "transactionManager",
    "actorRepository",
    "inviteCodeRepository",
    "subscriptionRepository",
    "syncRepoScheduler",
  ] as const;

  async execute({ actorDid, code }: SubscribeServerParams): Promise<void> {
    // 将来的には設定から招待コード不要にも出来るようにする
    if (!code) {
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const existingSubscription =
      await this.subscriptionRepository.findFirst(actorDid);
    if (existingSubscription) {
      throw new AlreadySubscribedError("Already subscribed to this server");
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

    const subscription = new Subscription({
      actorDid,
      inviteCode: code,
      createdAt: new Date(),
    });

    await this.transactionManager.transaction(async (ctx) => {
      const existingActor = await this.actorRepository.findByDid(actorDid);
      if (!existingActor) {
        const actor = Actor.create({
          did: actorDid,
        });
        await this.actorRepository.upsert({ ctx, actor });
      }

      await this.subscriptionRepository.save({ ctx, subscription });

      inviteCode.markAsUsed();
      await this.inviteCodeRepository.upsert({ ctx, inviteCode });
    });

    await this.syncRepoScheduler.schedule(actorDid);
  }
}
