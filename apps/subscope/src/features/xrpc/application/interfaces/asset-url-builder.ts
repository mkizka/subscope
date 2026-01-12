export interface IAssetUrlBuilder {
  getAvatarThumbnailUrl: (actorDid: string, cid: string) => string;
  getBannerUrl: (actorDid: string, cid: string) => string;
  getFeedThumbnailUrl: (actorDid: string, cid: string) => string;
  getFeedFullsizeUrl: (actorDid: string, cid: string) => string;
}
