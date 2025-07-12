import type { AppBskyActorSearchActorsTypeahead } from "@repo/client/server";

import type { ProfileViewBuilder } from "../../service/actor/profile-view-builder.js";
import type { ProfileSearchService } from "../../service/search/profile-search-service.js";

type SearchActorsTypeaheadParams = {
  query: string | undefined;
  limit: number;
};

export class SearchActorsTypeaheadUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}
  static inject = ["profileSearchService", "profileViewBuilder"] as const;

  async execute(
    params: SearchActorsTypeaheadParams,
  ): Promise<AppBskyActorSearchActorsTypeahead.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        actors: [],
      };
    }

    const profiles = await this.profileSearchService.findActorsTypeahead({
      query: params.query,
      limit: params.limit,
    });

    const actors = profiles.map((profile) =>
      this.profileViewBuilder.profileViewBasic(profile),
    );

    return {
      actors,
    };
  }
}
