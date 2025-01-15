import type { ProfileDetailed } from "@dawn/common/domain";

export interface IProfileRepository {
  findManyDetailed: (params: {
    handleOrDids: string[];
  }) => Promise<ProfileDetailed[]>;
}
