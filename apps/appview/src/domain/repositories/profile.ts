import type { Profile } from "../models/profile.js";

export interface IProfileRepository {
  createOrUpdate(profile: Profile): Promise<void>;
}
