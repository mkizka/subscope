export class InMemoryAssetUrlBuilder {
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
