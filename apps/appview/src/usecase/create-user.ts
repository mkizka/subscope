import { User } from "../domain/models/user.js";

interface IUserRepository {
  save(user: User): Promise<void>;
}

export class CreateUser {
  constructor(private userRepository: IUserRepository) {}
  static inject = ["userRepository"] as const;

  async execute(did: string) {
    const user = new User(did);
    await this.userRepository.save(user);
    return user;
  }
}
