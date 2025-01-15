import type { Did } from "@atproto/did";
import type { ProfileDetailed } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

export interface IProfileRepository {
  findManyDetailed: (
    handleOrDids: (Handle | Did)[],
  ) => Promise<ProfileDetailed[]>;
}
