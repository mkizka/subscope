import type { ILabelCursorStore } from "../../application/interfaces/external/label-cursor-store.js";

export class InMemoryLabelCursorStore implements ILabelCursorStore {
  private readonly cursors = new Map<string, number>();

  clear() {
    this.cursors.clear();
  }

  async getCursor(moderationUrl: string) {
    return this.cursors.get(moderationUrl);
  }

  async setCursor(moderationUrl: string, cursor: number) {
    this.cursors.set(moderationUrl, cursor);
  }
}
