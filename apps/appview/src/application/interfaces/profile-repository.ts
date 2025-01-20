import type { Did } from "@atproto/did";
import type { ProfileDetailed } from "@dawn/common/domain";

export interface IProfileRepository {
  findManyDetailed: (dids: Did[]) => Promise<ProfileDetailed[]>;
}
