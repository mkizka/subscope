import type { IPushSubscriptionCommand } from "@/app/server/application/interfaces/push-subscription-command";

export interface IUnsubscribePushUseCase {
  execute: (did: string, endpoint: string) => Promise<void>;
}

export const unsubscribePushUseCaseFactory = ({
  pushSubscriptionCommand,
}: {
  pushSubscriptionCommand: IPushSubscriptionCommand;
}): IUnsubscribePushUseCase => ({
  execute: (did, endpoint) => pushSubscriptionCommand.delete(did, endpoint),
});
