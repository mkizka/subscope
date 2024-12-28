import type { Profile } from "../models/profile.js";

export interface IProfileRepository {
  findOne(did: string): Promise<Profile | null>;
  createOrUpdate(profile: Profile): Promise<void>;
}
