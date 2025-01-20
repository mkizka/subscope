import type { Did } from "@atproto/did";
import { type Handle, isHandle } from "@dawn/common/utils";

import type { IHandlesToDidsRepository } from "./interfaces/handles-to-dids-repository.js";
import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class FindProfilesDetailedUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly handlesToDidsRepository: IHandlesToDidsRepository,
  ) {}
  static inject = ["profileRepository", "handlesToDidsRepository"] as const;

  async execute(handleOrDids: (Handle | Did)[]) {
    const handles = handleOrDids.filter((handleOrDid) => isHandle(handleOrDid));
    const didsByHandle =
      await this.handlesToDidsRepository.findDidsByHandle(handles);
    const dids = handleOrDids
      .map((handleOrDid) =>
        isHandle(handleOrDid) ? didsByHandle[handleOrDid] : handleOrDid,
      )
      .filter((did) => !!did);
    const profiles = await this.profileRepository.findManyDetailed(dids);
    return profiles.map((profile) => profile.toJSON());
  }
}
