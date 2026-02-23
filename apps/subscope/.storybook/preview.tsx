import "@/app/app.css";
import "./preview.css";

import type { Preview } from "@storybook/react-vite";
import { createMemoryRouter, RouterProvider } from "react-router";

const preview: Preview = {
  decorators: (Story) => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <Story />,
      },
    ]);
    return <RouterProvider router={router} />;
  },
};

export default preview;
