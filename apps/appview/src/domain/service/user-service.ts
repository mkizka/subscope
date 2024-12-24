import type { User } from "../models/user.js";

export class UserService {
  constructor(private user: User) {}

  validateUser() {
    // validate user
  }
}
