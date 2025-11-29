import { env } from "../../shared/env.js";

// TODO: interfaceかく
export class AssetUrlBuilder {
  static inject = [] as const;

  // TODO: avatar,bunnerが使われていないので確認
  getAvatarThumbnailUrl(actorDid: string, cid: string): string {
    return `${env.BLOB_PROXY_URL}/images/avatar_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getBannerUrl(actorDid: string, cid: string): string {
    return `${env.BLOB_PROXY_URL}/images/banner/${actorDid}/${cid}.jpg`;
  }

  getFeedThumbnailUrl(actorDid: string, cid: string): string {
    return `${env.BLOB_PROXY_URL}/images/feed_thumbnail/${actorDid}/${cid}.jpg`;
  }

  getFeedFullsizeUrl(actorDid: string, cid: string): string {
    return `${env.BLOB_PROXY_URL}/images/feed_fullsize/${actorDid}/${cid}.jpg`;
  }
}
