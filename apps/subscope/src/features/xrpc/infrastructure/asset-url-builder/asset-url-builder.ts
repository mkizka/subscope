import type { IAssetUrlBuilder } from "../../application/interfaces/asset-url-builder.js";

export class AssetUrlBuilder implements IAssetUrlBuilder {
  constructor(private readonly publicUrl: string) {}
  static inject = ["publicUrl"] as const;

  // TODO: avatar,bunnerが使われていないので確認
  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.publicUrl}/images/avatar_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${this.publicUrl}/images/banner/${actorDid}/${cid}.jpg`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${this.publicUrl}/images/feed_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${this.publicUrl}/images/feed_fullsize/${actorDid}/${cid}.jpg`;
  }
}
