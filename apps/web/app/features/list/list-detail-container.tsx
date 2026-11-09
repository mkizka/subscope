import { useQuery } from "@tanstack/react-query";
import { useNavigation, useSearchParams, useSubmit } from "react-router";

import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.list.$handle.$rkey";

import { ListDetail } from "./list-detail";

type ListResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  handle: string;
  rkey: string;
};

export function ListDetailContainer({ handle, rkey }: Props) {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "members" ? "members" : "posts";
  const submit = useSubmit();
  const navigation = useNavigation();
  const { data } = useQuery({
    queryKey: ["list", handle, rkey, tab],
    queryFn: () =>
      fetchJson<ListResponse>(
        `/api/list/${handle}/${rkey}?${new URLSearchParams({ tab })}`,
      ),
    throwOnError: true,
  });

  if (!data) {
    return tab === "members" ? <AccountsSkeleton /> : <PostsSkeleton />;
  }
  const { list, ...rest } = data;
  return (
    <ListDetail
      handle={handle}
      uri={list.uri}
      name={list.name}
      description={list.description}
      tab={tab}
      {...rest}
      deleting={navigation.formData?.get("intent") === "delete"}
      onDelete={() => submit({ intent: "delete" }, { method: "post" })}
    />
  );
}
