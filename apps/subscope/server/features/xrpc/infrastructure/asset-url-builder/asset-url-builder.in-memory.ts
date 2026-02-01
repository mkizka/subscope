import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class InMemoryAssetUrlBuilder implements IAssetUrlBuilder {
  static inject = [] as const;

  private readonly baseUrl = "http://test-blob-proxy.example.com";

  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/images/avatar_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/images/banner/${actorDid}/${cid}.jpg`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/images/feed_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${this.baseUrl}/images/feed_fullsize/${actorDid}/${cid}.jpg`;
  }
}
