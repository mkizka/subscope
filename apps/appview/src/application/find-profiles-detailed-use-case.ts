import type { IProfileRepository } from "./interfaces/profile-repository.js";

export class FindProfilesDetailedUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  async execute(dids: string[]) {
    const profiles = await this.profileRepository.findManyDetailed({ dids });
    return profiles.map((profile) => profile.toJSON());
  }
}
