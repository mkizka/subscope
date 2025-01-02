import type { User } from "@dawn/common/domain";

export interface IUserRepository {
  findOne: (params: { did: string }) => Promise<User | null>;
}
