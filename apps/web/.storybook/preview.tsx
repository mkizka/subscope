import "@/app/app.css";
import "./preview.css";

import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const preview: Preview = {
  decorators: (Story) => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <QueryClientProvider client={queryClient}>
            <Story />
          </QueryClientProvider>
        ),
      },
    ]);
    return <RouterProvider router={router} />;
  },
};

export default preview;
