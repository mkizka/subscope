import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CalendarIcon,
  HomeIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "./sidebar";

const items = [
  { title: "Home", icon: HomeIcon },
  { title: "Inbox", icon: InboxIcon },
  { title: "Calendar", icon: CalendarIcon },
  { title: "Search", icon: SearchIcon },
  { title: "Settings", icon: SettingsIcon },
];

const meta = {
  title: "ui/Sidebar",
  component: Sidebar,
  args: {
    side: "left",
    variant: "sidebar",
    collapsible: "offcanvas",
  },
  argTypes: {
    side: {
      control: "select",
      options: ["left", "right"],
    },
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
    },
  },
  render: (args) => (
    <SidebarProvider>
      <Sidebar
        side={args.side}
        variant={args.variant}
        collapsible={args.collapsible}
      >
        <SidebarHeader>
          <span className="px-2 text-lg font-semibold">App Name</span>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <span className="px-2 text-xs text-muted-foreground">
            Footer content
          </span>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Page Title</span>
        </header>
        <main className="p-4">
          <p>Main content area</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
