import { ImageBlob } from "../domain/image-blob.js";
import type { ICacheMetadataRepository } from "./interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "./interfaces/image-cache-storage.js";

export class ImageCacheService {
  static inject = ["cacheMetadataRepository", "imageCacheStorage"] as const;

  constructor(
    private cacheMetadataRepository: ICacheMetadataRepository,
    private imageCacheStorage: IImageCacheStorage,
  ) {}

  async get(cacheKey: string): Promise<ImageBlob | null> {
    const cacheEntry = await this.cacheMetadataRepository.get(cacheKey);
    if (!cacheEntry) {
      return null;
    }

    const data = await this.imageCacheStorage.read(cacheEntry.getPath());
    if (!data) {
      await this.cacheMetadataRepository.delete(cacheKey);
      return null;
    }

    return new ImageBlob({
      data,
      contentType: "image/jpeg",
    });
  }

  async set(cacheKey: string, blob: ImageBlob): Promise<void> {
    const cacheEntry = await this.cacheMetadataRepository.save(cacheKey);
    await this.imageCacheStorage.save(cacheEntry.getPath(), blob.data);
  }
}
