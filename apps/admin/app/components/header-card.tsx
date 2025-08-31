import { Link } from "react-router";

import { cn } from "~/utils/cn";

export function HeaderCard({ className }: { className?: string }) {
  return (
    <Link className={cn("card bg-base-100 w-full shadow-sm", className)} to="/">
      <div className="card-body items-center">
        <h1 className="text-xl font-bold">Subscope Admin</h1>
      </div>
    </Link>
  );
}
