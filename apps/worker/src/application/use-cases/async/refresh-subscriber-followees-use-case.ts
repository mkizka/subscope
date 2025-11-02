import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";

export class RefreshSubscriberFolloweesUseCase {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async execute(): Promise<void> {
    await this.db
      .refreshMaterializedView(schema.subscriberFollowees)
      .concurrently();
  }
}
