import type { IActorQuery } from "../../interfaces/queries/actor-query.js";

export class GetSetupStatusUseCase {
  constructor(private readonly actorQuery: IActorQuery) {}

  async execute(): Promise<{ initialized: boolean }> {
    const hasAnyAdmin = await this.actorQuery.hasAnyAdmin();
    return { initialized: hasAnyAdmin };
  }
}
