import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const getInviteCodesUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string, cursor?: string) =>
    adminRepository.getInviteCodes(did, cursor);
