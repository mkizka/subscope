import { randomUUID } from "node:crypto";

import type { Did } from "@atproto/did";

export type TapAddRepoPayload = {
  actorDid: Did;
};

export type OutboxEventData = {
  eventType: "tap_add_repo";
  payload: TapAddRepoPayload;
};

export class OutboxEvent<T extends OutboxEventData = OutboxEventData> {
  private constructor(
    readonly id: string,
    readonly eventType: T["eventType"],
    readonly payload: T["payload"],
    readonly createdAt: Date,
    private _processedAt: Date | null,
  ) {}

  get processedAt(): Date | null {
    return this._processedAt;
  }

  static create<T extends OutboxEventData>(data: T): OutboxEvent<T> {
    return new OutboxEvent(
      randomUUID(),
      data.eventType,
      data.payload,
      new Date(),
      null,
    );
  }

  static reconstruct<T extends OutboxEventData>(params: {
    id: string;
    eventType: T["eventType"];
    payload: T["payload"];
    createdAt: Date;
    processedAt: Date | null;
  }): OutboxEvent<T> {
    return new OutboxEvent(
      params.id,
      params.eventType,
      params.payload,
      params.createdAt,
      params.processedAt,
    );
  }

  markAsProcessed(): void {
    if (this._processedAt !== null) {
      throw new Error("Event is already processed");
    }
    this._processedAt = new Date();
  }
}
