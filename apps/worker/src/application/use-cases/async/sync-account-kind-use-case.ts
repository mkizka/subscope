import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { AccountRoster } from "../../../domain/account-roster.js";
import type { StoragePolicy } from "../../../domain/services/storage-policy.js";
import type { ILabelFetcher } from "../../interfaces/external/label-fetcher.js";
import type { IndexLabelService } from "../../services/index-label-service.js";
import type { TapRepoService } from "../../services/tap-repo-service.js";

export class SyncAccountKindUseCase {
  constructor(
    private readonly deps: {
      tapRepoService: TapRepoService;
      storagePolicy: StoragePolicy;
      accountRoster: AccountRoster;
      labelFetcher: ILabelFetcher;
      indexLabelService: IndexLabelService;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute({ did }: { did: Did }) {
    const kind = await this.deps.transactionManager.transaction((ctx) =>
      this.deps.storagePolicy.classify(ctx, did),
    );
    if (kind.usesTap) {
      this.deps.accountRoster.set(did, kind);
      await this.deps.tapRepoService.add(did);
    } else {
      await this.deps.tapRepoService.remove(did);
      this.deps.accountRoster.set(did, kind);
    }
    if (kind.syncsLabels) {
      const labels = await this.deps.labelFetcher.fetchByAccount(did);
      await this.deps.transactionManager.transaction(async (ctx) => {
        for (const label of labels) {
          await this.deps.indexLabelService.index({ ctx, label });
        }
      });
    }
  }
}
