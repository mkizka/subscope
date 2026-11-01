export interface ILabelCursorStore {
  getCursor: (moderationUrl: string) => Promise<number | undefined>;
  setCursor: (moderationUrl: string, cursor: number) => Promise<void>;
}
