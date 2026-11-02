import type { ProfileDto } from "../../../application/dto/profile-dto.js";
import type { IProfileQuery } from "../../../application/interfaces/profile-query.js";
import {
  createCursorPaginator,
  type Page,
} from "../../../application/utils/pagination.js";

export class ProfileSearchService {
  constructor(private readonly profileQuery: IProfileQuery) {}

  async findActorsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: Date;
    limit: number;
  }): Promise<Page<ProfileDto>> {
    const paginator = createCursorPaginator<ProfileDto>({
      limit,
      getCursor: (item) => item.indexedAt.toISOString(),
    });

    const profiles = await this.profileQuery.search({
      query,
      limit: paginator.queryLimit,
      cursor,
    });

    return paginator.extractPage(profiles);
  }

  async findActorsTypeahead({
    query,
    limit,
  }: {
    query: string;
    limit: number;
  }): Promise<ProfileDto[]> {
    return await this.profileQuery.search({ query, limit });
  }
}
