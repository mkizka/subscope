import type { UriString } from "@atproto/syntax";

export interface IAssetUrlBuilder {
  getAvatarThumbnailUrl: (actorDid: string, cid: string) => UriString;
  getBannerUrl: (actorDid: string, cid: string) => UriString;
  getFeedThumbnailUrl: (actorDid: string, cid: string) => UriString;
  getFeedFullsizeUrl: (actorDid: string, cid: string) => UriString;
}
