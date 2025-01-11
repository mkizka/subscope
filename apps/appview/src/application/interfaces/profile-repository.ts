import type { ProfileDetailed } from "@dawn/common/domain";

export interface IProfileRepository {
  findManyDetailed: (params: { dids: string[] }) => Promise<ProfileDetailed[]>;
}
