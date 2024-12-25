export class User {
  did: string;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  description: string | null;

  constructor(options: {
    did: string;
    handle: string;
    displayName: string | null;
    avatar: string | null;
    description: string | null;
  }) {
    this.did = options.did;
    this.handle = options.handle;
    this.displayName = options.displayName;
    this.avatar = options.avatar;
    this.description = options.description;
  }
}
