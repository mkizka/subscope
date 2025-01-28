import { Actor, type ITransactionManager, Post } from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IPostRepository } from "../interfaces/post-repository.js";
import type { IQueueService } from "../interfaces/queue.js";
import type { UpsertPostDto } from "./upsert-post-dto.js";

export class UpsertPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly actorRepository: IActorRepository,
    private readonly transactionManager: ITransactionManager,
    private readonly queue: IQueueService,
  ) {}
  static inject = [
    "postRepository",
    "actorRepository",
    "transactionManager",
    "queue",
  ] as const;

  async execute(dto: UpsertPostDto) {
    await this.transactionManager.transaction(async (ctx) => {
      const exists = await this.actorRepository.exists({
        ctx,
        did: dto.actorDid,
      });
      if (!exists) {
        const actor = new Actor({ did: dto.actorDid });
        await Promise.all([
          this.queue.addTask("resolveDid", dto.actorDid),
          this.actorRepository.createOrUpdate({ ctx, actor }),
        ]);
      }
      const post = new Post(dto);
      await this.postRepository.createOrUpdate({ ctx, post });
    });
  }
}
