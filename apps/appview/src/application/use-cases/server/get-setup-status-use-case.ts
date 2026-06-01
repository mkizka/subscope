import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";

export class GetSetupStatusUseCase {
  constructor(private readonly actorRepository: IActorRepository) {}
  static inject = ["actorRepository"] as const;

  async execute(): Promise<{ initialized: boolean }> {
    const hasAnyAdmin = await this.actorRepository.hasAnyAdmin();
    return { initialized: hasAnyAdmin };
  }
}
