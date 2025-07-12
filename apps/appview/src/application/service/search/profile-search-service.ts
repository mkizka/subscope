import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IProfileRepository } from "../../interfaces/profile-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";
import type { ProfileViewBuilder } from "../view/profile-view-builder.js";

export class ProfileSearchService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}
  static inject = ["profileRepository", "profileViewBuilder"] as const;

  async searchActorsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<$Typed<AppBskyActorDefs.ProfileView>>> {
    const paginator = createCursorPaginator<ProfileDetailed>({
      limit,
      getCursor: (item) => required(item.indexedAt?.toISOString()),
    });

    const profiles = await this.profileRepository.searchActors({
      query,
      limit: paginator.queryLimit,
      cursor,
    });

    const page = paginator.extractPage(profiles);

    return {
      items: page.items.map((profile) =>
        this.profileViewBuilder.profileView(profile),
      ),
      cursor: page.cursor,
    };
  }

  async searchActorsTypeahead({
    query,
    limit,
  }: {
    query: string;
    limit: number;
  }): Promise<$Typed<AppBskyActorDefs.ProfileViewBasic>[]> {
    const profiles = await this.profileRepository.searchActors({
      query,
      limit,
    });

    return profiles.map((profile) =>
      this.profileViewBuilder.profileViewBasic(profile),
    );
  }
}
