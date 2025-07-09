import type { AppBskyActorSearchActorsTypeahead } from "@repo/client/server";

import type { ProfileViewService } from "../../service/view/profile-view-service.js";

type SearchActorsTypeaheadParams = {
  query: string | undefined;
  limit: number;
};

export class SearchActorsTypeaheadUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(
    params: SearchActorsTypeaheadParams,
  ): Promise<AppBskyActorSearchActorsTypeahead.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        actors: [],
      };
    }

    const actors = await this.profileViewService.searchActorsTypeahead({
      query: params.query,
      limit: params.limit,
    });

    return {
      actors,
    };
  }
}
