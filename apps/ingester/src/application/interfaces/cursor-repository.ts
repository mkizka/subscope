export interface ICursorRepository {
  set: (cursor: number) => Promise<void>;
  get: () => Promise<number | null>;
}
