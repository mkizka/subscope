import type { Did } from "@atproto/did";
import type { Profile } from "@dawn/common/domain";

export interface IProfileFetcher {
  fetch: (did: Did) => Promise<Profile | null>;
}
