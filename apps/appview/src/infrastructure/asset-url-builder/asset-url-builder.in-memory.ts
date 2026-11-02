import type { UriString } from "@atproto/syntax";

import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class InMemoryAssetUrlBuilder implements IAssetUrlBuilder {
  private readonly baseUrl = "http://test-image-proxy.example.com";

  getAvatarThumbnailUrl(accountDid: string, cid: string): UriString {
    return `${this.baseUrl}/img/avatar_thumbnail/plain/${accountDid}/${cid}`;
  }

  getBannerUrl(accountDid: string, cid: string): UriString {
    return `${this.baseUrl}/img/banner/plain/${accountDid}/${cid}`;
  }

  getFeedThumbnailUrl(accountDid: string, cid: string): UriString {
    return `${this.baseUrl}/img/feed_thumbnail/plain/${accountDid}/${cid}`;
  }

  getFeedFullsizeUrl(accountDid: string, cid: string): UriString {
    return `${this.baseUrl}/img/feed_fullsize/plain/${accountDid}/${cid}`;
  }
}
