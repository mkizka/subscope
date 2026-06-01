export interface IImageCacheStorage {
  save: (filePath: string, data: Uint8Array) => Promise<void>;
  read: (filePath: string) => Promise<Uint8Array | null>;
  remove: (filePath: string) => Promise<void>;
}
