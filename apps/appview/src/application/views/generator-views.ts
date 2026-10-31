import type { $Typed } from "@atproto/lex";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

export class GeneratorViews {
  constructor(
    private readonly profileViews: ProfileViews,
    private readonly assetUrlBuilder: IAssetUrlBuilder,
  ) {}

  async generatorView(
    uri: string,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.GeneratorView> | undefined> {
    const generator = await ctx.generator(uri);
    const creator =
      generator && (await this.profileViews.view(generator.actorDid, ctx));
    if (!generator || !creator) {
      return undefined;
    }
    return {
      $type: "app.bsky.feed.defs#generatorView",
      uri: generator.uri,
      cid: generator.cid,
      did: generator.did,
      creator,
      displayName: generator.displayName,
      description: generator.description ?? undefined,
      avatar: generator.avatarCid
        ? this.assetUrlBuilder.getAvatarThumbnailUrl(
            generator.actorDid,
            generator.avatarCid,
          )
        : undefined,
      indexedAt: toDatetimeString(generator.indexedAt),
    };
  }
}
