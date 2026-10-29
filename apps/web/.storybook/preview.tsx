import "@/app/app.css";
import "./preview.css";

import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const preview: Preview = {
  parameters: {
    viewport: {
      options: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "812px" },
          type: "mobile",
        },
      },
    },
  },
  initialGlobals: {
    viewport: { value: "mobile", isRotated: false },
  },
  decorators: [
    (Story, { parameters }) => {
      const Stub = createRoutesStub([
        { path: "*", Component: Story, action: () => null },
      ]);
      return (
        <QueryClientProvider client={queryClient}>
          <Stub initialEntries={[parameters.path ?? "/"]} />
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
