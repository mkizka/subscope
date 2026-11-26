import type { TransactionContext } from "@repo/common/interface";

import type { IRegistrationQuery } from "../interfaces/registration-query.js";
import type { Notification } from "../notification.js";
import type { Origin } from "../origin.js";

export class NotificationPolicy {
  constructor(private readonly registrationQuery: IRegistrationQuery) {}

  async selectDeliverable({
    ctx,
    origin,
    candidates,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    candidates: () => Notification[] | Promise<Notification[]>;
  }) {
    if (!origin.notifies) {
      return [];
    }
    const byRecipient = new Map<string, Notification>();
    for (const candidate of await candidates()) {
      const { recipientDid, authorDid } = candidate;
      if (recipientDid === authorDid || byRecipient.has(recipientDid)) {
        continue;
      }
      const isMember = await this.registrationQuery.isMember(ctx, recipientDid);
      if (isMember) {
        byRecipient.set(recipientDid, candidate);
      }
    }
    return [...byRecipient.values()];
  }
}
