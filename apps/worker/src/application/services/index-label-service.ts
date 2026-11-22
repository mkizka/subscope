import { isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { IAccountQuery } from "../interfaces/queries/account-query.js";
import type {
  ILabelRepository,
  LabelData,
} from "../interfaces/repositories/label-repository.js";

export class IndexLabelService {
  constructor(
    private readonly labelRepository: ILabelRepository,
    private readonly accountQuery: IAccountQuery,
  ) {}

  async index({ ctx, label }: { ctx: TransactionContext; label: LabelData }) {
    if (label.neg) {
      await this.labelRepository.delete({ ctx, label });
      return;
    }
    const did = label.uri.startsWith("at://")
      ? new AtUri(label.uri).host
      : label.uri;
    if (!isDid(did)) {
      return;
    }
    const accountExists = await this.accountQuery.exists({ ctx, did });
    if (!accountExists) {
      return;
    }
    await this.labelRepository.save({ ctx, label, accountDid: did });
  }
}
