import type { TransactionContext } from "@repo/common/interface";

import type { Origin } from "../dto/origin.js";
import type { IRegistrationQuery } from "../interfaces/queries/registration-query.js";
import type { Notification } from "../interfaces/repositories/notification-repository.js";
import type { ICollectionIndexer } from "./indexer/collection-indexer.js";

export class NotificationPolicyService {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async notificationsFor<T>({
    ctx,
    origin,
    indexer,
    parsed,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    indexer: ICollectionIndexer<T>;
    parsed: T;
  }): Promise<Notification[]> {
    if (origin.type !== "tapLive") {
      return [];
    }
    const candidates =
      (await indexer.notificationCandidates?.({ ctx, parsed })) ?? [];
    const notifications = new Map<string, Notification>();
    for (const candidate of candidates) {
      if (
        candidate.recipientDid === candidate.authorDid ||
        notifications.has(candidate.recipientDid)
      ) {
        continue;
      }
      const isRecipientRegistered = await this.registrationQuery.isRegistered(
        ctx,
        candidate.recipientDid,
      );
      if (isRecipientRegistered) {
        notifications.set(candidate.recipientDid, candidate);
      }
    }
    return [...notifications.values()];
  }
}
