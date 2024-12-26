import type { User } from "../models/user.js";

export interface IUserRepository {
  createOrUpdate(user: User): Promise<void>;
}
