import type { ICursorStore } from "../../application/interfaces/external/cursor-store.js";

export class InMemoryCursorStore implements ICursorStore {
  private readonly cursors = new Map<string, number>();

  clear() {
    this.cursors.clear();
  }

  async getCursor(url: string) {
    return this.cursors.get(url);
  }

  async setCursor(url: string, cursor: number) {
    this.cursors.set(url, cursor);
  }
}
