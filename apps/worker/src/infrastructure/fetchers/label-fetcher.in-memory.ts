import type { Did } from "@atproto/did";
import type { JobData } from "@repo/common/domain";

import type { ILabelFetcher } from "../../application/interfaces/external/label-fetcher.js";

export class InMemoryLabelFetcher implements ILabelFetcher {
  private labels: JobData["label"][] = [];

  add(label: JobData["label"]) {
    this.labels.push(label);
  }

  async fetchByActor(did: Did) {
    return this.labels.filter(
      (label) => label.uri === did || label.uri.startsWith(`at://${did}/`),
    );
  }
}
