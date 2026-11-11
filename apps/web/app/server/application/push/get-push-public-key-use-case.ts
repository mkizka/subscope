import { env } from "@/app/server/env";

export interface IGetPushPublicKeyUseCase {
  execute: () => string | null;
}

export const getPushPublicKeyUseCaseFactory = (): IGetPushPublicKeyUseCase => ({
  execute: () => env.VAPID_PUBLIC_KEY ?? null,
});
