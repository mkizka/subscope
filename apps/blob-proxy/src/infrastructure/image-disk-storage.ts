import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { IImageCacheStorage } from "../application/interfaces/image-cache-storage.js";

function isFileNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export class ImageDiskStorage implements IImageCacheStorage {
  async save(filePath: string, data: Uint8Array): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async read(filePath: string): Promise<Uint8Array | null> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async remove(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }
    }
  }
}
