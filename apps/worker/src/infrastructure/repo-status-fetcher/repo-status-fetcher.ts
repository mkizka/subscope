import type { Did } from "@atproto/did";

import type { IRepoStatusFetcher } from "../../application/interfaces/external/repo-status-fetcher.js";
import type { Env } from "../../shared/env.js";

export class RepoStatusFetcher implements IRepoStatusFetcher {
  constructor(private readonly env: Pick<Env, "RELAY_URL">) {}

  async isDeleted(did: Did): Promise<boolean> {
    const url = new URL(
      "/xrpc/com.atproto.sync.getRepoStatus",
      this.env.RELAY_URL,
    );
    url.searchParams.set("did", did);
    const res = await fetch(url);
    if (!res.ok) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { status } = (await res.json()) as { status?: string };
    return status === "deleted";
  }
}
