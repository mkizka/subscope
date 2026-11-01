import type { Did } from "@atproto/did";

import type { ILabelFetcher } from "../../application/interfaces/external/label-fetcher.js";
import type { LabelData } from "../../application/interfaces/repositories/label-repository.js";

export class InMemoryLabelFetcher implements ILabelFetcher {
  private labels: LabelData[] = [];

  add(label: LabelData) {
    this.labels.push(label);
  }

  async fetchByActor(did: Did) {
    return this.labels.filter(
      (label) => label.uri === did || label.uri.startsWith(`at://${did}/`),
    );
  }
}
