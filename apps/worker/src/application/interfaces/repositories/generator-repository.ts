import type { TransactionContext } from "@repo/common/domain";

import type { Generator } from "../../models/generator.js";

export interface IGeneratorRepository {
  save: (params: {
    ctx: TransactionContext;
    generator: Generator;
  }) => Promise<void>;
}
