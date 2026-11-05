import type { TransactionContext } from "@repo/common/interface";

import type { Generator } from "../../dto/generator.js";

export interface IGeneratorRepository {
  save: (params: {
    ctx: TransactionContext;
    generator: Generator;
  }) => Promise<void>;
}
