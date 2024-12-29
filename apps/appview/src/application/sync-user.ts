import type { Did } from "@atproto/api";

import { User } from "../domain/models/user.js";
import type { IDidResolver } from "../domain/repositories/did-resolver.js";
import type { ITransactionManager } from "../domain/repositories/transaction-manager.js";
import type { IUserRepository } from "../domain/repositories/user.js";

export class SyncUserUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly userRepository: IUserRepository,
    private readonly didResolver: IDidResolver,
  ) {}
  static inject = [
    "transactionManager",
    "userRepository",
    "didResolver",
  ] as const;

  async execute(dto: { did: Did; handle?: string }) {
    await this.transactionManager.transaction(async (ctx) => {
      const user = await this.userRepository.findOne({ ctx, did: dto.did });
      if (!user) {
        const { handle } = await this.didResolver.resolve(dto.did);
        const newUser = new User({ did: dto.did, handle });
        await this.userRepository.createOrUpdate({ ctx, user: newUser });
      } else if (dto.handle && dto.handle !== user.handle) {
        const updatedUser = new User({ ...user, handle: dto.handle });
        await this.userRepository.createOrUpdate({ ctx, user: updatedUser });
      }
    });
  }
}
