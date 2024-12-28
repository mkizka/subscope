import type { Did } from "@atproto/did";

import { Profile } from "../domain/models/profile.js";
import type { IProfileRepository } from "../domain/repositories/profile.js";

export class SyncProfileUseCase {
  constructor(private profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  async execute(dto: {
    did: Did;
    avatar?: string;
    description?: string;
    displayName?: string;
  }) {
    const user = new Profile({
      ...dto,
      handle: "invalid.handle", // TODO: 実装
    });
    await this.profileRepository.createOrUpdate(user);
  }
}
