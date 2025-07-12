import type { ProfileDetailed } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IProfileRepository } from "../../interfaces/profile-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class ProfileSearchService {
  constructor(private readonly profileRepository: IProfileRepository) {}
  static inject = ["profileRepository"] as const;

  async findActorsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<ProfileDetailed>> {
    const paginator = createCursorPaginator<ProfileDetailed>({
      limit,
      getCursor: (item) => required(item.indexedAt?.toISOString()),
    });

    const profiles = await this.profileRepository.searchActors({
      query,
      limit: paginator.queryLimit,
      cursor: cursor?.toISOString(),
    });

    return paginator.extractPage(profiles);
  }

  async findActorsTypeahead({
    query,
    limit,
  }: {
    query: string;
    limit: number;
  }): Promise<ProfileDetailed[]> {
    return await this.profileRepository.searchActors({
      query,
      limit,
    });
  }
}
