import type { ComponentProps } from "react";
import { Link, useSearchParams } from "react-router";

export function ProfileLink({
  handle,
  ...props
}: Omit<ComponentProps<typeof Link>, "to"> & { handle: string }) {
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  params.set("profile", handle);
  return (
    <Link {...props} to={{ search: params.toString() }} preventScrollReset />
  );
}
