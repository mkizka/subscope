import type { Did } from "@atproto/did";
import { type ITransactionManager, Post } from "@dawn/common/domain";

import type { ActorService } from "../domain/actor-service.js";
import type { IActorRepository } from "./interfaces/actor-repository.js";
import type { IPostRepository } from "./interfaces/post-repository.js";

export class SyncPostUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}
  static inject = [
    "postRepository",
    "actorService",
    "actorRepository",
    "transactionManager",
  ] as const;

  async execute(dto: {
    rkey: string;
    actorDid: Did;
    text: string;
    langs: string[];
    createdAt: Date;
  }) {
    await this.transactionManager.transaction(async (ctx) => {
      const exists = await this.actorRepository.exists({
        ctx,
        did: dto.actorDid,
      });
      if (!exists) {
        const newActor = await this.actorService.resolveActor(dto.actorDid);
        await this.actorRepository.createOrUpdate({ ctx, actor: newActor });
      }
      const post = new Post(dto);
      await this.postRepository.createOrUpdate({ ctx, post });
    });
  }
}
