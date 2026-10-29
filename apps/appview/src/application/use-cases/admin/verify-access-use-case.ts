import type { Did } from "@atproto/did";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";

type VerifyAccessParams = {
  requesterDid: Did;
};

export class VerifyAccessUseCase {
  constructor(private readonly actorRepository: IActorRepository) {}

  async execute(
    params: VerifyAccessParams,
  ): Promise<{ status: "authorized" | "unauthorized" }> {
    const actor = await this.actorRepository.findByDid(params.requesterDid);
    if (actor?.isAdmin) {
      return { status: "authorized" };
    }

    return { status: "unauthorized" };
  }
}
