import type { IAdminRepository } from "@/app/server/infrastructure/admin/admin-repository";

export const getSubscribersUseCaseFactory =
  ({ adminRepository }: { adminRepository: IAdminRepository }) =>
  (did: string, cursor?: string) =>
    adminRepository.getSubscribers(did, cursor);
