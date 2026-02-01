import type { IImageCacheStorage } from "@/server/features/blob-proxy/application/interfaces/image-cache-storage.js";

type SaveResult = { data: Uint8Array } | { error: string };

export class InMemoryImageCacheStorage implements IImageCacheStorage {
  private storage: Map<string, SaveResult> = new Map();

  setSaveResult(filePath: string, data: Uint8Array): void {
    this.storage.set(filePath, { data });
  }

  setSaveError(filePath: string, errorMessage: string): void {
    this.storage.set(filePath, { error: errorMessage });
  }

  clear(): void {
    this.storage.clear();
  }

  save(filePath: string, data: Uint8Array): Promise<void> {
    const result = this.storage.get(filePath);
    if (result && "error" in result) {
      return Promise.reject(new Error(result.error));
    }

    this.storage.set(filePath, { data });
    return Promise.resolve();
  }

  read(filePath: string): Promise<Uint8Array | null> {
    const result = this.storage.get(filePath);
    if (!result || "error" in result) {
      return Promise.resolve(null);
    }
    return Promise.resolve(result.data);
  }

  remove(filePath: string): Promise<void> {
    this.storage.delete(filePath);
    return Promise.resolve();
  }
}
