import type { Profile } from "./profile.js";

export interface IProfileRepository {
  findOne: (params: { did: string }) => Promise<Profile | null>;
}
