import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { createInviteCode, fetchInviteCodes } from "./fetcher";
import { InviteCodePresenter } from "./presenter";

const canUseInviteCode = (inviteCode: {
  expiresAt: string;
  usedAt?: string;
}) => {
  const isExpired = new Date(inviteCode.expiresAt) < new Date();
  const isUsed = !!inviteCode.usedAt;
  return !isExpired && !isUsed;
};

export function InviteCodeContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: inviteCodes,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isPending,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["invite-codes"],
    queryFn: fetchInviteCodes,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) =>
      data.pages
        .flatMap((page) => page.codes)
        .map((code) => ({ ...code, disabled: !canUseInviteCode(code) })),
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: createInviteCode,
    onSuccess: () => {
      setIsModalOpen(true);
      void refetch();
    },
  });

  // 初期描画時からspinnerを出しておきたいので、初回読み込み(isPending=true)の時もtrueにする
  const hasMore = isPending || hasNextPage;
  const loadMore = () => fetchNextPage();
  const reload = () => refetch();

  return (
    <InviteCodePresenter
      inviteCodes={inviteCodes}
      error={error}
      createInviteCode={() => mutation.mutate()}
      isCreatingInviteCode={mutation.isPending}
      createdInviteCode={mutation.data?.code}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      reload={reload}
      loadMore={loadMore}
      hasMore={hasMore}
      isFetching={isFetching}
      isRefetching={isRefetching}
    />
  );
}
