import type { DatabaseClient } from "@repo/common/domain";

import type { IndexActorService } from "../../services/index-actor-service.js";
import type { HandleAccountCommand } from "./handle-account-command.js";

export class HandleAccountUseCase {
  constructor(
    private readonly indexActorService: IndexActorService,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["indexActorService", "db"] as const;

  async execute(command: HandleAccountCommand) {
    const ctx = { db: this.db };

    if (command.status === "deleted") {
      await this.indexActorService.delete({
        ctx,
        did: command.did,
      });
      return;
    }

    // TODO: 他のステータスの処理を実装する
    // - deactivated
    // - suspended
    // - takendown
    // - throttled
    // - desynchronized
  }
}
