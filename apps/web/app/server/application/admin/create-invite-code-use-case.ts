import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const createInviteCodeUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string) =>
    adminRepository.createInviteCode(did);
