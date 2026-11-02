import type { Did } from "@atproto/did";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";

type GetRegistrationStatusParams = {
  actorDid: Did;
};

export class GetRegistrationStatusUseCase {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: GetRegistrationStatusParams) {
    const registration = await this.registrationRepository.find(
      params.actorDid,
    );

    if (!registration) {
      return {
        $type: "me.subsco.sync.getRegistrationStatus#notRegistered",
        isRegistered: false,
      } as const;
    }

    return {
      $type: "me.subsco.sync.getRegistrationStatus#registered",
      isRegistered: true,
    } as const;
  }
}
