export class InMemoryTapClient {
  registeredDids = new Set();
  async addRepo(did) {
    this.registeredDids.add(did);
  }
  async removeRepo(did) {
    this.registeredDids.delete(did);
  }
  getRegisteredDids() {
    return Array.from(this.registeredDids);
  }
  clear() {
    this.registeredDids.clear();
  }
}
