import type {
  IPushSubscriptionCommand,
  PushSubscriptionDto,
} from "@/app/server/application/interfaces/push-subscription-command";

export interface ISubscribePushUseCase {
  execute: (did: string, subscription: PushSubscriptionDto) => Promise<void>;
}

export const subscribePushUseCaseFactory = ({
  pushSubscriptionCommand,
}: {
  pushSubscriptionCommand: IPushSubscriptionCommand;
}): ISubscribePushUseCase => ({
  execute: (did, subscription) =>
    pushSubscriptionCommand.upsert(did, subscription),
});
