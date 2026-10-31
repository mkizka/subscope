import { type Did } from "@atproto/did";
import type * as AppBskyActorSearchActorsTypeahead from "@repo/client/lex/app/bsky/actor/searchActorsTypeahead";

import type { ProfileSearchService } from "../../../application/service/search/profile-search-service.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type SearchActorsTypeaheadParams = {
  query: string | undefined;
  limit: number;
  viewerDid?: Did | null;
};

export class SearchActorsTypeaheadUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: SearchActorsTypeaheadParams,
  ): Promise<AppBskyActorSearchActorsTypeahead.$OutputBody> {
    if (!params.query || params.query.trim() === "") {
      return {
        actors: [],
      };
    }

    const profiles = await this.profileSearchService.findActorsTypeahead({
      query: params.query,
      limit: params.limit,
    });

    const ctx = this.viewContextFactory.create({
      viewerDid: params.viewerDid,
    });
    const actors = await Promise.all(
      profiles.map((profile) => this.profileViews.basic(profile.actorDid, ctx)),
    );

    return {
      actors: actors.filter((actor) => actor !== undefined),
    };
  }
}
