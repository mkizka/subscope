import { isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountQuery } from "../../interfaces/queries/account-query.js";
import type {
  ILabelRepository,
  LabelData,
} from "../../interfaces/repositories/label-repository.js";

export class IndexLabelUseCase {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly accountQuery: IAccountQuery,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(label: LabelData) {
    await this.transactionManager.transaction(async (ctx) => {
      if (label.neg) {
        await this.labelRepository.delete({ ctx, label });
        return;
      }
      const did = label.uri.startsWith("at://")
        ? new AtUri(label.uri).host
        : label.uri;
      if (!isDid(did) || !(await this.accountQuery.exists({ ctx, did }))) {
        return;
      }
      await this.labelRepository.save({ ctx, label, accountDid: did });
    });
  }
}
