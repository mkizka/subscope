import type { UriString } from "@atproto/syntax";

export interface IAssetUrlBuilder {
  getAvatarThumbnailUrl: (accountDid: string, cid: string) => UriString;
  getBannerUrl: (accountDid: string, cid: string) => UriString;
  getFeedThumbnailUrl: (accountDid: string, cid: string) => UriString;
  getFeedFullsizeUrl: (accountDid: string, cid: string) => UriString;
}
