import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { createInviteCode, fetchInviteCodes } from "./fetcher";
import { InviteCodePresentation } from "./presentation";

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
    select: (data) => data.pages.flatMap((page) => page.codes),
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
    <InviteCodePresentation
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
