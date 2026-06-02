import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class AssetUrlBuilder implements IAssetUrlBuilder {
  constructor(private readonly blobProxyUrl: string) {}
  static inject = ["blobProxyUrl"] as const;

  // TODO: avatar,bunnerが使われていないので確認
  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/images/avatar_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/images/banner/${actorDid}/${cid}.jpg`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/images/feed_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/images/feed_fullsize/${actorDid}/${cid}.jpg`;
  }
}
