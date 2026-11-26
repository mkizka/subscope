import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Label } from "../../../domain/label.js";

export interface ILabelRepository {
  save: (params: {
    ctx: TransactionContext;
    label: Label;
    accountDid: Did;
  }) => Promise<void>;
  delete: (params: { ctx: TransactionContext; label: Label }) => Promise<void>;
}
