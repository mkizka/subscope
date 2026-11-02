import type { Generator, TransactionContext } from "@repo/common/domain";

export interface IGeneratorRepository {
  save: (params: {
    ctx: TransactionContext;
    generator: Generator;
  }) => Promise<void>;
}
