import "../app/app.css";

import type { Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

import { RootLayout } from "~/components/root-layout";

const preview: Preview = {
  decorators: [
    (Story) => (
      // <Link />コンポーネントを使用できるようにする
      <MemoryRouter>
        <RootLayout>
          <Story />
        </RootLayout>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
