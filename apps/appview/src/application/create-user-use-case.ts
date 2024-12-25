import type { AppBskyActorProfile } from "@atproto/api";

import type { User } from "../domain/models/user.js";
import { userMapper } from "./user-mapper.js";

export interface IUserRepository {
  save(user: User): Promise<void>;
}

export interface ICreateUserUseCase {
  execute(atpUser: AppBskyActorProfile.Record): Promise<void>;
}

export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  static inject = ["userRepository"] as const;

  async execute(atpUser: AppBskyActorProfile.Record) {
    const user = userMapper.fromATP(atpUser);
    await this.userRepository.save(user);
  }
}
