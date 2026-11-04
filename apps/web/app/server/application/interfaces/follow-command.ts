export interface IFollowCommand {
  create: (did: string, subject: `did:${string}:${string}`) => Promise<string>;
  delete: (did: string, uri: string) => Promise<void>;
}
