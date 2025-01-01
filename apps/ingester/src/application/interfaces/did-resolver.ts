export interface IDidResolver {
  resolve: (did: string) => Promise<{
    handle: string;
  }>;
}
