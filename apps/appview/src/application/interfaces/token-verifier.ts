import type { Did } from "@atproto/did";

export interface ITokenVerifier {
  verify: (params: {
    token: string;
    nsid: string;
  }) => Promise<{ did: Did } | null>;
}
