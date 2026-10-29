import { type Did } from "@atproto/did";
import type * as AppBskyActorSearchActors from "@repo/client/lex/app/bsky/actor/searchActors";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import type { ProfileSearchService } from "../../../application/service/search/profile-search-service.js";

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

  async execute(
    params: SearchActorsParams,
  ): Promise<AppBskyActorSearchActors.$OutputBody> {
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
