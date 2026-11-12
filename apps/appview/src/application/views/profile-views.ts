import type { Did } from "@atproto/did";
import { getBlobCidString, isPlainObject } from "@atproto/lex";
import { asAtUriString, AtUri, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyActorDefs from "@repo/client/app/bsky/actor/defs";
import { validateRecord } from "@repo/common/utils";

import type { ProfileDto } from "../dto/profile-dto.js";
import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import { toLabelViews, toSelfLabelViews } from "./label-views.js";
import type { ViewContext } from "./view-context.js";

export class ProfileViews {
  constructor(private readonly assetUrlBuilder: IAssetUrlBuilder) {}

  async basic(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewBasic | undefined> {
    const profile = await ctx.profile(did);
    return profile && (await this.toBasic(profile, ctx));
  }

  async view(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileView | undefined> {
    const profile = await ctx.profile(did);
    if (!profile) {
      return undefined;
    }
    return {
      ...(await this.toBasic(profile, ctx)),
      $type: "app.bsky.actor.defs#profileView",
      description: profile.description ?? undefined,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  async detailed(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewDetailed | undefined> {
    const profile = await ctx.profile(did);
    if (!profile) {
      return undefined;
    }
    const [basic, stats, links, known] = await Promise.all([
      this.toBasic(profile, ctx),
      ctx.accountStats(did),
      this.links(did, ctx),
      ctx.knownFollowers(did),
    ]);
    const knownFollowers =
      known && known.count > 0
        ? {
            count: known.count,
            followers: (
              await Promise.all(known.dids.map((d) => this.basic(d, ctx)))
            ).filter((follower) => follower !== undefined),
          }
        : undefined;
    return {
      ...basic,
      viewer: basic.viewer && { ...basic.viewer, knownFollowers },
      $type: "app.bsky.actor.defs#profileViewDetailed",
      description: profile.description ?? undefined,
      banner: profile.bannerCid
        ? this.assetUrlBuilder.getBannerUrl(
            profile.accountDid,
            profile.bannerCid,
          )
        : undefined,
      links: links.length > 0 ? links : undefined,
      followersCount: stats?.followersCount ?? 0,
      followsCount: stats?.followsCount ?? 0,
      postsCount: stats?.postsCount ?? 0,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  private async links(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileLinkView[]> {
    const profileRecord = await ctx.record(
      AtUri.make(did, "app.bsky.actor.profile", "self").toString(),
    );
    const refs: unknown =
      isPlainObject(profileRecord?.json) && profileRecord.json.links;
    if (!Array.isArray(refs)) {
      return [];
    }
    const views = await Promise.all(
      refs.map(
        async (ref: unknown): Promise<AppBskyActorDefs.ProfileLinkView[]> => {
          const uri = isPlainObject(ref) && ref.uri;
          if (typeof uri !== "string") {
            return [];
          }
          const atUri = new AtUri(uri);
          if (
            atUri.host !== did ||
            atUri.collection !== "app.bsky.actor.link"
          ) {
            return [];
          }
          const [record, labels] = await Promise.all([
            ctx.visibleRecord(uri),
            ctx.labelsOf(uri),
          ]);
          if (!record) {
            return [];
          }
          const parsed = validateRecord("app.bsky.actor.link", record);
          const iconCid = getBlobCidString(parsed.icon);
          return [
            {
              $type: "app.bsky.actor.defs#profileLinkView",
              uri: asAtUriString(record.uri),
              cid: record.cid,
              url: parsed.url,
              title: parsed.title,
              icon: iconCid
                ? this.assetUrlBuilder.getAvatarThumbnailUrl(did, iconCid)
                : undefined,
              labels: [...toLabelViews(labels), ...toSelfLabelViews(record)],
            },
          ];
        },
      ),
    );
    return views.flat();
  }

  private async toBasic(
    profile: ProfileDto,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewBasic> {
    const profileUri = AtUri.make(
      profile.accountDid,
      "app.bsky.actor.profile",
      "self",
    ).toString();
    const [viewerState, didLabels, profileLabels, record] = await Promise.all([
      ctx.viewerState(profile.accountDid),
      ctx.labelsOf(profile.accountDid),
      ctx.labelsOf(profileUri),
      ctx.record(profileUri),
    ]);
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.accountDid,
      handle: profile.handle ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: profile.avatarCid
        ? this.assetUrlBuilder.getAvatarThumbnailUrl(
            profile.accountDid,
            profile.avatarCid,
          )
        : undefined,
      viewer: {
        $type: "app.bsky.actor.defs#viewerState",
        following: viewerState.following,
        followedBy: viewerState.followedBy,
      },
      labels: [
        ...toLabelViews(didLabels),
        ...toLabelViews(profileLabels),
        ...toSelfLabelViews(record),
      ],
      createdAt: profile.createdAt
        ? toDatetimeString(profile.createdAt)
        : undefined,
    };
  }
}
