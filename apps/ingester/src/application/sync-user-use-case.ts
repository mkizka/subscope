import type { Did } from "@atproto/api";
import { User } from "@dawn/common/domain";
import type { DatabaseClient } from "@dawn/db";

import type { IDidResolver } from "./interfaces/did-resolver.js";
import type { IUserRepository } from "./interfaces/user-repository.js";

export class SyncUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly didResolver: IDidResolver,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["userRepository", "didResolver", "db"] as const;

  async execute(dto: { did: Did; handle?: string }) {
    let handle = dto.handle;
    if (!handle) {
      const data = await this.didResolver.resolve(dto.did);
      handle = data?.handle;
    }
    const user = new User({ did: dto.did, handle });
    await this.userRepository.createOrUpdate({ ctx: { db: this.db }, user });
  }
}
