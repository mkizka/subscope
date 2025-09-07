import "../app/app.css";

import type { Preview } from "@storybook/react-vite";
import { createMemoryRouter, RouterProvider } from "react-router";

import { RootLayout } from "~/components/root-layout";

const preview: Preview = {
  decorators: [
    (Story) => {
      // Linkコンポーネントなどを動作させるためにRouterでラップする
      const router = createMemoryRouter(
        [
          {
            path: "/",
            element: (
              <RootLayout>
                <Story />
              </RootLayout>
            ),
          },
        ],
        {
          initialEntries: ["/"],
        },
      );
      return <RouterProvider router={router} />;
    },
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
