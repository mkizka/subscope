import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class AssetUrlBuilder implements IAssetUrlBuilder {
  constructor(private readonly blobProxyUrl: string) {}
  static inject = ["blobProxyUrl"] as const;

  // TODO: avatar,bunnerが使われていないので確認
  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/img/avatar_thumbnail/plain/${actorDid}/${cid}`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/img/banner/plain/${actorDid}/${cid}`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/img/feed_thumbnail/plain/${actorDid}/${cid}`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${this.blobProxyUrl}/img/feed_fullsize/plain/${actorDid}/${cid}`;
  }
}
