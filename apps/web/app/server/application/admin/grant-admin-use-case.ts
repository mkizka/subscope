import type { DidString } from "@atproto/syntax";

import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const grantAdminUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string, target: DidString) =>
    adminRepository.grantAdmin(did, target);
