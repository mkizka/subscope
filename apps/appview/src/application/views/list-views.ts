import type { $Typed } from "@atproto/lex";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyGraphDefs from "@repo/client/lex/app/bsky/graph/defs";

import type { ListDto } from "../dto/list-dto.js";
import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

export class ListViews {
  constructor(
    private readonly profileViews: ProfileViews,
    private readonly assetUrlBuilder: IAssetUrlBuilder,
  ) {}

  async basic(
    uri: string,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyGraphDefs.ListViewBasic> | undefined> {
    const list = await ctx.list(uri);
    if (!list) {
      return undefined;
    }
    return {
      $type: "app.bsky.graph.defs#listViewBasic",
      ...this.toBase(list),
    };
  }

  async view(
    uri: string,
    ctx: ViewContext,
  ): Promise<AppBskyGraphDefs.ListView | undefined> {
    const list = await ctx.list(uri);
    const creator = list && (await this.profileViews.view(list.actorDid, ctx));
    if (!list || !creator) {
      return undefined;
    }
    return {
      ...this.toBase(list),
      creator,
      description: list.description ?? undefined,
    };
  }

  private toBase(list: ListDto) {
    return {
      uri: list.uri,
      cid: list.cid,
      name: list.name,
      purpose: list.purpose,
      avatar: list.avatarCid
        ? this.assetUrlBuilder.getAvatarThumbnailUrl(
            list.actorDid,
            list.avatarCid,
          )
        : undefined,
      indexedAt: toDatetimeString(list.indexedAt),
    };
  }
}
