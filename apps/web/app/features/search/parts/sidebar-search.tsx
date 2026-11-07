import { Form } from "react-router";

import { Input } from "@/app/components/ui/input";

export function SidebarSearch() {
  return (
    <Form action="/search">
      <Input type="search" name="q" aria-label="検索語" placeholder="検索" />
    </Form>
  );
}
