import { SidebarTrigger } from "@/app/components/ui/sidebar";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
    </header>
  );
}
