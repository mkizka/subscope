import type { ComponentProps } from "react";
import { Form, Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Input } from "@/app/components/ui/input";
import type { AccountDto } from "@/app/server/application/dto/account";

type Props = {
  inputProps: ComponentProps<"input">;
  suggestions: AccountDto[];
  onSelect: () => void;
};

export function SidebarSearch({ inputProps, suggestions, onSelect }: Props) {
  return (
    <div className="group relative">
      <Form action="/search">
        <Input
          type="search"
          name="q"
          aria-label="検索語"
          placeholder="検索"
          autoComplete="off"
          {...inputProps}
        />
      </Form>
      {suggestions.length > 0 && (
        <ul
          className="
            absolute inset-x-0 top-full z-10 mt-1 hidden overflow-hidden
            rounded-lg border border-line bg-surface shadow-lg
            group-focus-within:block
          "
        >
          {suggestions.map((account) => (
            <li key={account.did}>
              <Link
                to={`/${account.handle}`}
                onClick={onSelect}
                className="
                  flex items-center gap-3 px-4 py-2
                  hover:bg-surface-2
                "
              >
                <Avatar src={account.avatarUrl} size="sm" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body">
                    {account.displayName || account.handle}
                  </span>
                  <span className="truncate text-label text-muted">
                    {account.handle}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
