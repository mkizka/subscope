import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyGraphDefs from "@repo/client/lex/app/bsky/graph/defs";

import type { ListDto } from "../../../application/dto/list-dto.js";
import type { IAssetUrlBuilder } from "../../../application/interfaces/asset-url-builder.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import { toMapByDid } from "../../../application/utils/map.js";

export class ListViewService {
  constructor(
    private readonly profileViewService: ProfileViewService,
    private readonly assetUrlBuilder: IAssetUrlBuilder,
  ) {}

  async findListViews(lists: ListDto[]): Promise<AppBskyGraphDefs.ListView[]> {
    const profileMap = await this.profileViewService
      .findProfileView([...new Set(lists.map((list) => list.actorDid))])
      .then(toMapByDid);

    return lists.flatMap((list) => {
      const creator = profileMap.get(list.actorDid);
      if (!creator) return [];
      return {
        uri: list.uri,
        cid: list.cid,
        creator,
        name: list.name,
        purpose: list.purpose,
        description: list.description ?? undefined,
        avatar: list.avatarCid
          ? this.assetUrlBuilder.getAvatarThumbnailUrl(
              list.actorDid,
              list.avatarCid,
            )
          : undefined,
        indexedAt: toDatetimeString(list.indexedAt),
      };
    });
  }
}
