import type { TransactionContext } from "@repo/common/interface";

import { Label, type LabelData } from "../../domain/label.js";
import type { IAccountQuery } from "../interfaces/queries/account-query.js";
import type { ILabelRepository } from "../interfaces/repositories/label-repository.js";

export class IndexLabelService {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly accountQuery: IAccountQuery,
  ) {}

  async index({
    ctx,
    label: data,
  }: {
    ctx: TransactionContext;
    label: LabelData;
  }) {
    const label = Label.from(data);
    if (label.isNegation) {
      await this.labelRepository.delete({ ctx, label });
      return;
    }
    const did = label.subjectDid;
    if (!did) {
      return;
    }
    const accountExists = await this.accountQuery.exists({ ctx, did });
    if (!accountExists) {
      return;
    }
    await this.labelRepository.save({ ctx, label, accountDid: did });
  }
}
