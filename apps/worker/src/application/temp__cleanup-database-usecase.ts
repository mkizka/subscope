import type { DatabaseClient } from "@dawn/common/domain";
import { schema } from "@dawn/db";

export class Temp__CleanupDatabaseUseCase {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async execute() {
    await this.db.delete(schema.blobs);
    await this.db.delete(schema.profiles);
    await this.db.delete(schema.posts);
    await this.db.delete(schema.records);
    await this.db.delete(schema.actors);
  }
}
