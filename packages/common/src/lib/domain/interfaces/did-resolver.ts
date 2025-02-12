export interface IDidResolver {
  resolve: (did: string) => Promise<{
    did: string;
    signingKey: string;
    handle: string;
    pds: string;
  } | null>;
}
