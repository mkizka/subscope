import type { RegisterResult } from "@/app/server/application/dto/register-result";

export interface ISubscopeCommand {
  registerAdmin: (did: string) => Promise<void>;
  subscribe: (did: string, inviteCode: string) => Promise<RegisterResult>;
}
