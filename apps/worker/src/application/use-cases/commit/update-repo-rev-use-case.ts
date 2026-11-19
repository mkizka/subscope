import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IRepoRevRepository } from "../../interfaces/repositories/repo-rev-repository.js";

export class UpdateRepoRevUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly repoRevRepository: IRepoRevRepository,
  ) {}

  async execute({ did, rev }: { did: Did; rev: string }) {
    await this.transactionManager.transaction((ctx) =>
      this.repoRevRepository.save({ ctx, did, rev }),
    );
  }
}
