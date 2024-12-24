import { User } from "../domain/user.js";

interface IUserRepository {
  save(user: User): Promise<void>;
}

export class CreateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(did: string) {
    const user = new User(did);
    await this.userRepository.save(user);
  }
}
