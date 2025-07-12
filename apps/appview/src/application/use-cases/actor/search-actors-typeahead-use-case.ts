import type { AppBskyActorSearchActorsTypeahead } from "@repo/client/server";

import type { ProfileSearchService } from "../../service/search/profile-search-service.js";

type SearchActorsTypeaheadParams = {
  query: string | undefined;
  limit: number;
};

export class SearchActorsTypeaheadUseCase {
  constructor(private readonly profileSearchService: ProfileSearchService) {}
  static inject = ["profileSearchService"] as const;

  async execute(
    params: SearchActorsTypeaheadParams,
  ): Promise<AppBskyActorSearchActorsTypeahead.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        actors: [],
      };
    }

    const actors = await this.profileSearchService.searchActorsTypeahead({
      query: params.query,
      limit: params.limit,
    });

    return {
      actors,
    };
  }
}
