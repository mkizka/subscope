import type { UriString } from "@atproto/syntax";

import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";
import type { Env } from "../../shared/env.js";

export class AssetUrlBuilder implements IAssetUrlBuilder {
  constructor(private readonly env: Pick<Env, "BLOB_PROXY_URL">) {}

  // TODO: avatar,bunnerが使われていないので確認
  getAvatarThumbnailUrl(accountDid: string, cid: string): UriString {
    return `${this.env.BLOB_PROXY_URL}/img/avatar_thumbnail/plain/${accountDid}/${cid}`;
  }

  getBannerUrl(accountDid: string, cid: string): UriString {
    return `${this.env.BLOB_PROXY_URL}/img/banner/plain/${accountDid}/${cid}`;
  }

  getFeedThumbnailUrl(accountDid: string, cid: string): UriString {
    return `${this.env.BLOB_PROXY_URL}/img/feed_thumbnail/plain/${accountDid}/${cid}`;
  }

  getFeedFullsizeUrl(accountDid: string, cid: string): UriString {
    return `${this.env.BLOB_PROXY_URL}/img/feed_fullsize/plain/${accountDid}/${cid}`;
  }

  getVideoPlaylistUrl(accountDid: string, cid: string): UriString {
    return `https://video.bsky.app/watch/${accountDid}/${cid}/playlist.m3u8`;
  }

  getVideoThumbnailUrl(accountDid: string, cid: string): UriString {
    return `https://video.bsky.app/watch/${accountDid}/${cid}/thumbnail.jpg`;
  }
}
