import { AtUri } from "@atproto/syntax";
import type { DatabaseClient, JobData } from "@repo/common/domain";

import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";

type AggregateStatsCommand = {
  postUri: string;
  type: JobData["aggregateStats"]["type"];
};

export class AggregateStatsUseCase {
  constructor(
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["postStatsRepository", "db"] as const;

  async execute(command: AggregateStatsCommand) {
    const ctx = { db: this.db };
    const uri = new AtUri(command.postUri);

    if (command.type === "reply") {
      await this.postStatsRepository.upsertReplyCount({ ctx, uri });
    } else {
      await this.postStatsRepository.upsertAllCount({ ctx, uri });
    }
  }
}
