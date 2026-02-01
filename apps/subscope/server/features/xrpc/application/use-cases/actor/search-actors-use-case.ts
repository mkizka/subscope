import { type Did } from "@atproto/did";
import type { AppBskyActorSearchActors } from "@repo/client/server";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import type { ProfileSearchService } from "@/server/features/xrpc/application/service/search/profile-search-service.js";

type SearchActorsParams = {
  query: string | undefined;
  limit: number;
  cursor?: string;
  viewerDid?: Did | null;
};

export class SearchActorsUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["profileSearchService", "profileViewService"] as const;

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

    const dids = result.items.map((profile) => profile.actorDid);
    const actors = await this.profileViewService.findProfileView(
      dids,
      params.viewerDid,
    );

    return {
      cursor: result.cursor,
      actors,
    };
  }
}
