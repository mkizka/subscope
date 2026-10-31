import type { $Typed } from "@atproto/lex";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyGraphDefs from "@repo/client/lex/app/bsky/graph/defs";

import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import type { ViewContext } from "./view-context.js";

export class ListViews {
  constructor(private readonly assetUrlBuilder: IAssetUrlBuilder) {}

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
