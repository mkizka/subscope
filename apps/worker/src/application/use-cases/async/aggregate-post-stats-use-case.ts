import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";

import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../../interfaces/repositories/post-stats-repository.js";
import type { AggregatePostStatsCommand } from "./aggregate-post-stats-command.js";

export class AggregatePostStatsUseCase {
  constructor(
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly postRepository: IPostRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["postStatsRepository", "postRepository", "db"] as const;

  async execute(command: AggregatePostStatsCommand) {
    const ctx = { db: this.db };
    const uri = new AtUri(command.postUri);

    const postExists = await this.postRepository.exists(ctx, uri);
    if (!postExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.postUri} - post not found`,
      );
      return;
    }

    if (command.type === "reply") {
      await this.postStatsRepository.upsertReplyCount({ ctx, uri });
    } else if (command.type === "repost") {
      await this.postStatsRepository.upsertRepostCount({ ctx, uri });
    } else if (command.type === "quote") {
      await this.postStatsRepository.upsertQuoteCount({ ctx, uri });
    } else if (command.type === "like") {
      await this.postStatsRepository.upsertLikeCount({ ctx, uri });
    } else {
      await this.postStatsRepository.upsertAllCount({ ctx, uri });
    }
  }
}
