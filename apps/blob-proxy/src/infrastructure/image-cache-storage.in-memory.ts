import type { IImageCacheStorage } from "../application/interfaces/image-cache-storage.js";

export class InMemoryImageCacheStorage implements IImageCacheStorage {
  private storage: Map<string, Uint8Array> = new Map();
  private saveErrors: Map<string, string> = new Map();

  setSaveResult(filePath: string, data: Uint8Array): void {
    this.storage.set(filePath, data);
  }

  setSaveError(filePath: string, errorMessage: string): void {
    this.saveErrors.set(filePath, errorMessage);
  }

  clear(): void {
    this.storage.clear();
    this.saveErrors.clear();
  }

  save(filePath: string, data: Uint8Array): Promise<void> {
    const error = this.saveErrors.get(filePath);
    if (error) {
      return Promise.reject(new Error(error));
    }

    this.storage.set(filePath, data);
    return Promise.resolve();
  }

  read(filePath: string): Promise<Uint8Array | null> {
    return Promise.resolve(this.storage.get(filePath) ?? null);
  }

  remove(filePath: string): Promise<void> {
    this.storage.delete(filePath);
    return Promise.resolve();
  }
}
