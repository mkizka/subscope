import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { IProfileQuery } from "../../../application/interfaces/queries/profile-query.js";
import type { InMemoryProfileRepository } from "../../repositories/profile-repository/profile-repository.in-memory.js";

export class InMemoryProfileQuery implements IProfileQuery {
  constructor(private readonly profileRepository: InMemoryProfileRepository) {}

  async exists(params: {
    ctx: TransactionContext;
    actorDid: Did;
  }): Promise<boolean> {
    return this.profileRepository
      .findAll()
      .some((profile) => profile.actorDid === params.actorDid);
  }
}
