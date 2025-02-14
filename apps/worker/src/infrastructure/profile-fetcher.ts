import type { Did } from "@atproto/did";
import { AtpBaseClient } from "@dawn/client";
import type { IDidResolver, IMetricReporter } from "@dawn/common/domain";
import { Profile, Record } from "@dawn/common/domain";

import type { IProfileFetcher } from "../application/interfaces/profile-fetcher.js";

export class ProfileFetcher implements IProfileFetcher {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly metricReporter: IMetricReporter,
  ) {}
  static inject = ["didResolver", "metricReporter"] as const;

  async fetch(did: Did) {
    this.metricReporter.increment("fetch_profile_total");
    const { pds } = await this.didResolver.resolve(did);
    const agent = new AtpBaseClient(pds);
    try {
      const profile = await agent.app.bsky.actor.profile.get({
        repo: did,
        rkey: "self",
      });
      const record = new Record({
        uri: profile.uri,
        cid: profile.cid,
        json: profile.value,
      });
      return Profile.from(record);
    } catch (error) {
      this.metricReporter.increment("fetch_profile_error_total");
      throw error;
    }
  }
}
