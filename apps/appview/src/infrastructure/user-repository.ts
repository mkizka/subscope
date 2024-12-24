import type { User } from "../domain/user.js";

export class UserRepository {
  async save(user: User) {
    // prisma.user.create( ... )
  }
}
