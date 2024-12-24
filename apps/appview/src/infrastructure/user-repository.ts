import type { User } from "../domain/models/user.js";

export class UserRepository {
  async save(user: User) {
    // eslint-disable-next-line no-console
    console.log(`User ${user.did} saved`);
    return Promise.resolve();
  }
}
