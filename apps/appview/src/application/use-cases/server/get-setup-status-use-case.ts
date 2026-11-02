import type { IAccountQuery } from "../../interfaces/queries/account-query.js";

export class GetSetupStatusUseCase {
  constructor(private readonly accountQuery: IAccountQuery) {}

  async execute(): Promise<{ initialized: boolean }> {
    const hasAnyAdmin = await this.accountQuery.hasAnyAdmin();
    return { initialized: hasAnyAdmin };
  }
}
