import type { User } from "../domain/user.js";

export class UserService {
  constructor(private user: User) {}

  validateUser() {
    // validate user
  }
}
