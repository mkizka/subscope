import type { ComponentProps } from "react";
import { Link } from "react-router";

export function ProfileLink({
  handle,
  ...props
}: Omit<ComponentProps<typeof Link>, "to"> & { handle: string }) {
  return <Link {...props} to={`/profile/${handle}`} />;
}
