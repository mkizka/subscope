import { type Did } from "@atproto/did";
import type * as AppBskyActorSearchActors from "@repo/client/lex/app/bsky/actor/searchActors";

import type { ProfileSearchService } from "../../../application/service/search/profile-search-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type SearchActorsParams = {
  query: string | undefined;
  limit: number;
  cursor?: string;
  viewerDid?: Did | null;
};

export class SearchActorsUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
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

    const ctx = this.viewContextFactory.create({
      viewerDid: params.viewerDid,
    });
    const actors = await Promise.all(
      result.items.map((profile) =>
        this.profileViews.view(profile.actorDid, ctx),
      ),
    );

    return {
      cursor: result.cursor,
      actors: actors.filter((actor) => actor !== undefined),
    };
  }
}
