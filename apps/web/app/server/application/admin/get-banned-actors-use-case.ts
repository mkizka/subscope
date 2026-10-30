import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const getBannedActorsUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string, cursor?: string) =>
    adminRepository.getBannedActors(did, cursor);
