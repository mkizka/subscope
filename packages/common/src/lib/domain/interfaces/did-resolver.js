export class DidResolutionError extends Error {
  constructor(did) {
    super(`Failed to resolve DID: ${did} `);
    this.name = "DidResolutionError";
  }
}
