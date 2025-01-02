import type { Profile } from "@dawn/common/domain";

export interface IProfileRepository {
  findOne: (params: { did: string }) => Promise<Profile | null>;
}
