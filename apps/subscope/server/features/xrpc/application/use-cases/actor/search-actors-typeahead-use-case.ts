import { type Did } from "@atproto/did";
import type { AppBskyActorSearchActorsTypeahead } from "@repo/client/server";

import type { ProfileViewService } from "../../service/actor/profile-view-service.js";
import type { ProfileSearchService } from "../../service/search/profile-search-service.js";

type SearchActorsTypeaheadParams = {
  query: string | undefined;
  limit: number;
  viewerDid?: Did | null;
};

export class SearchActorsTypeaheadUseCase {
  constructor(
    private readonly profileSearchService: ProfileSearchService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["profileSearchService", "profileViewService"] as const;

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

    const dids = profiles.map((profile) => profile.actorDid);
    // TODO: 2回profileをDBから取得しているので引数をdidsではなくprofilesにする？
    const actors = await this.profileViewService.findProfileViewBasic(
      dids,
      params.viewerDid,
    );

    return {
      actors,
    };
  }
}
