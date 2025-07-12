import type { AppBskyActorSearchActors } from "@repo/client/server";

import type { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import type { ProfileSearchService } from "../../service/search/profile-search-service.js";

type SearchActorsParams = {
  query: string | undefined;
  limit: number;
  cursor?: string;
};

export class SearchActorsUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}
  static inject = ["profileSearchService", "profileViewBuilder"] as const;

  async execute(
    params: SearchActorsParams,
  ): Promise<AppBskyActorSearchActors.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        cursor: undefined,
        actors: [],
      };
    }

    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const result = await this.profileSearchService.findActorsWithPagination({
      query: params.query,
      limit: params.limit,
      cursor,
    });

    const actors = result.items.map((profile) =>
      this.profileViewBuilder.profileView(profile),
    );

    return {
      cursor: result.cursor,
      actors,
    };
  }
}
