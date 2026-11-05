export interface IPostQuery {
  exists: (did: string, uri: string) => Promise<boolean>;
}
