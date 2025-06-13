export class CacheMetadata {
  readonly cacheKey: string;
  readonly createdAt: Date;

  constructor(params: { cacheKey: string; createdAt: Date }) {
    this.cacheKey = params.cacheKey;
    this.createdAt = params.createdAt;
  }

  getPath(): string {
    return `${this.cacheKey}.jpg`;
  }
}
