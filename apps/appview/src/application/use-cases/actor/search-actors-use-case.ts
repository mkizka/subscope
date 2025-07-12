import type { AppBskyActorSearchActors } from "@repo/client/server";

import type { ProfileSearchService } from "../../service/search/profile-search-service.js";

type SearchActorsParams = {
  query: string | undefined;
  limit: number;
  cursor?: string;
};

export class SearchActorsUseCase {
  constructor(private readonly profileSearchService: ProfileSearchService) {}
  static inject = ["profileSearchService"] as const;

  async execute(
    params: SearchActorsParams,
  ): Promise<AppBskyActorSearchActors.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        cursor: undefined,
        actors: [],
      };
    }

    const result = await this.profileSearchService.searchActorsWithPagination({
      query: params.query,
      limit: params.limit,
      cursor: params.cursor,
    });

    return {
      cursor: result.cursor,
      actors: result.items,
    };
  }
}
