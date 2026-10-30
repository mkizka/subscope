import { DidResolutionError } from "../../domain/interfaces/did-resolver.js";
export class InMemoryDidResolver {
  results = new Map();
  setResolveResult(did, result) {
    this.results.set(did, result);
  }
  clear() {
    this.results.clear();
  }
  async resolve(did) {
    const result = this.results.get(did);
    if (!result) {
      throw new DidResolutionError(`No resolve result set for DID: ${did}`);
    }
    return result;
  }
}
