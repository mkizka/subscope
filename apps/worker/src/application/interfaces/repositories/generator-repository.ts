import type { Generator, TransactionContext } from "@repo/common/domain";

export interface IGeneratorRepository {
  upsert: (params: {
    ctx: TransactionContext;
    generator: Generator;
  }) => Promise<void>;
}
