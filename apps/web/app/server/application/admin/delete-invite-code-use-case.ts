import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const deleteInviteCodeUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string, code: string) =>
    adminRepository.deleteInviteCode(did, code);
