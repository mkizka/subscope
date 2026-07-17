import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class InMemoryAssetUrlBuilder implements IAssetUrlBuilder {
  static inject = [] as const;

  private readonly baseUrl = "http://test-image-proxy.example.com";

  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/img/avatar_thumbnail/plain/${actorDid}/${cid}`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/img/banner/plain/${actorDid}/${cid}`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/img/feed_thumbnail/plain/${actorDid}/${cid}`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/img/feed_fullsize/plain/${actorDid}/${cid}`;
  }
}
