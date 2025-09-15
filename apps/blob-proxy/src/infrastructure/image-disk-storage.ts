import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { ILoggerManager } from "@repo/common/domain";

import type { IImageCacheStorage } from "../application/interfaces/image-cache-storage.js";

function isFileNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export class ImageDiskStorage implements IImageCacheStorage {
  private readonly logger;

  constructor(loggerManager: ILoggerManager) {
    this.logger = loggerManager.createLogger("ImageDiskStorage");
  }
  static inject = ["loggerManager"] as const;

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
        this.logger.warn(`File not found during read: ${filePath}`);
        return null;
      }
      throw error;
    }
  }

  async remove(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (isFileNotFoundError(error)) {
        this.logger.warn(`File not found during removal: ${filePath}`);
        return;
      }
      throw error;
    }
  }
}
