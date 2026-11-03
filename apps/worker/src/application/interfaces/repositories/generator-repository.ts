import type { TransactionContext } from "@repo/common/domain";

import type { GeneratorRow } from "../../record-parsers.js";

export interface IGeneratorRepository {
  save: (params: {
    ctx: TransactionContext;
    generator: GeneratorRow;
  }) => Promise<void>;
}
