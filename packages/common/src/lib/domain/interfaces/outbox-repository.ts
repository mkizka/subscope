import type {
  OutboxEvent,
  OutboxEventData,
} from "../outbox-event/outbox-event.js";
import type { TransactionContext } from "./transaction.js";

export interface IOutboxRepository {
  save: <T extends OutboxEventData>(params: {
    ctx: TransactionContext;
    event: OutboxEvent<T>;
  }) => Promise<void>;

  findUnprocessed: () => Promise<OutboxEvent[]>;

  deleteProcessed: (params: { olderThan: Date }) => Promise<number>;
}
