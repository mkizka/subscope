import type { User } from "./user.js";

export interface IUserRepository {
  findOne: (params: { did: string }) => Promise<User | null>;
}
