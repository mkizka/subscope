import type { User } from "../models/user.js";
import type { IUserRepository } from "../repositories/user.js";

export class UserService {
  constructor(private userRepository: IUserRepository) {}
  static inject = ["userRepository"] as const;

  async sync(user: User) {
    await this.userRepository.createOrUpdate(user);
  }
}
