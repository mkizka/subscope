import type { ITransactionManager } from "@repo/common/interface";

import type { LabelData } from "../../interfaces/repositories/label-repository.js";
import type { IndexLabelService } from "../../services/index-label-service.js";

export class IndexLabelUseCase {
  constructor(
    private readonly indexLabelService: IndexLabelService,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(label: LabelData) {
    await this.transactionManager.transaction((ctx) =>
      this.indexLabelService.index({ ctx, label }),
    );
  }
}
