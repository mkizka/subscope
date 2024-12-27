import type { Profile } from "../models/profile.js";

export interface IProfileRepository {
  createOrUpdate(user: Profile): Promise<void>;
}
