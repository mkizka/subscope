export interface ICursorStore {
  getCursor: (url: string) => Promise<number | undefined>;
  setCursor: (url: string, cursor: number) => Promise<void>;
}
