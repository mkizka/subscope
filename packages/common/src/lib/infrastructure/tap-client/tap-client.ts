import type { Did } from "@atproto/did";

import type { ITapClient } from "../../domain/interfaces/tap-client.js";

export class TapClient implements ITapClient {
  constructor(private readonly tapUrl: string) {}
  static inject = ["tapUrl"] as const;

  async addRepo(did: Did): Promise<void> {
    const url = new URL("/repos/add", this.tapUrl);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ did }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to add repo to Tap: ${response.status} ${errorText}`,
      );
    }
  }
}
