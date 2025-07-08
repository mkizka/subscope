import type { AppBskyActorSearchActors } from "@repo/client/server";

import type { ProfileViewService } from "../../service/view/profile-view-service.js";

type SearchActorsParams = {
  query: string | undefined;
  limit: number;
  cursor?: string;
};

export class SearchActorsUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(
    params: SearchActorsParams,
  ): Promise<AppBskyActorSearchActors.OutputSchema> {
    if (!params.query || params.query.trim() === "") {
      return {
        cursor: undefined,
        actors: [],
      };
    }

    const result = await this.profileViewService.searchActorsWithPagination({
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
