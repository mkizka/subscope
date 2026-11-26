import type { Did } from "@atproto/did";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";

type GetRegistrationStatusParams = {
  accountDid: Did;
};

export class GetRegistrationStatusUseCase {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: GetRegistrationStatusParams) {
    const registration = await this.registrationRepository.find(
      params.accountDid,
    );

    if (!registration) {
      return {
        $type: "me.subsco.sync.getRegistrationStatus#notMember",
        isMember: false,
      } as const;
    }

    return {
      $type: "me.subsco.sync.getRegistrationStatus#member",
      isMember: true,
    } as const;
  }
}
