import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";

import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";

type AggregateStatsCommand = {
  postUri: string;
};

export class AggregateStatsUseCase {
  constructor(
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["postStatsRepository", "db"] as const;

  async execute(command: AggregateStatsCommand) {
    const uri = new AtUri(command.postUri);

    await this.postStatsRepository.upsertAllCount({
      ctx: { db: this.db },
      uri,
    });
  }
}
