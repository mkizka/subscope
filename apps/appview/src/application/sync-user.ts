import type { Did } from "@atproto/api";

import { User } from "../domain/models/user.js";
import type { IUserRepository } from "../domain/repositories/user.js";

export class SyncUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  static inject = ["userRepository"] as const;

  async execute(dto: { did: Did; handle?: string }) {
    const user = new User(dto);
    await this.userRepository.createOrUpdate(user);
  }
}
