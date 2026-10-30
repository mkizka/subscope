import { Tap } from "@atproto/tap";
export class TapClient {
  tap;
  constructor(tapUrl) {
    this.tap = new Tap(tapUrl);
  }
  async addRepo(did) {
    await this.tap.addRepos([did]);
  }
  async removeRepo(did) {
    await this.tap.removeRepos([did]);
  }
}
