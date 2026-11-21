import type { Did } from "@atproto/did";

import type { IRegistrationRepository } from "../../interfaces/registration-repository.js";

export class GetMemberStatusUseCase {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: { did: Did }): Promise<{ isMember: boolean }> {
    const registration = await this.registrationRepository.find(params.did);
    return { isMember: registration !== null };
  }
}
