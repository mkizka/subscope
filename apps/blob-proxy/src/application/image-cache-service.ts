import * as path from "node:path";

import { ImageBlob } from "../domain/image-blob.js";
import type { ImageTransformRequest } from "../domain/image-transform-request.js";
import { env } from "../shared/env.js";
import type { ICacheMetadataRepository } from "./interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "./interfaces/image-cache-storage.js";

export class ImageCacheService {
  static inject = ["cacheMetadataRepository", "imageCacheStorage"] as const;

  constructor(
    private cacheMetadataRepository: ICacheMetadataRepository,
    private imageCacheStorage: IImageCacheStorage,
  ) {}

  async get(request: ImageTransformRequest): Promise<ImageBlob | null> {
    const cacheKey = request.getCacheKey();
    const cacheEntry = await this.cacheMetadataRepository.get(cacheKey);
    if (!cacheEntry) {
      return null;
    }

    const filePath = path.join(env.BLOB_CACHE_DIR, `${cacheKey}.jpg`);
    const data = await this.imageCacheStorage.read(filePath);
    if (!data) {
      await this.cacheMetadataRepository.delete(cacheKey);
      return null;
    }

    return new ImageBlob({
      data,
      contentType: "image/jpeg",
    });
  }

  async set(request: ImageTransformRequest, blob: ImageBlob): Promise<void> {
    const cacheKey = request.getCacheKey();
    const filePath = path.join(env.BLOB_CACHE_DIR, `${cacheKey}.jpg`);

    try {
      await this.imageCacheStorage.save(filePath, blob.data);
      await this.cacheMetadataRepository.save(cacheKey);
    } catch (error) {
      await this.removeFileIfExists(filePath);
      throw error;
    }
  }

  private async removeFileIfExists(filePath: string): Promise<void> {
    try {
      await this.imageCacheStorage.remove(filePath);
    } catch {
      // ファイル削除の失敗は無視
    }
  }
}
