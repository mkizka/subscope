export class User {
  did: string;
  handle: string;

  constructor(options: { did: string; handle: string }) {
    this.did = options.did;
    this.handle = options.handle;
  }
}
