import type { Did } from "@atproto/api";

import type { IDidResolver } from "../domain/interfaces/did-resolver.js";
import { User } from "../domain/user/user.js";
import type { IUserRepository } from "../domain/user/user-repository.js";

export class SyncUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly didResolver: IDidResolver,
  ) {}
  static inject = ["userRepository", "didResolver"] as const;

  async execute(dto: { did: Did; handle?: string }) {
    let handle = dto.handle;
    if (!handle) {
      const data = await this.didResolver.resolve(dto.did);
      handle = data.handle;
    }
    const user = new User({ did: dto.did, handle });
    await this.userRepository.createOrUpdate({ user });
  }
}
