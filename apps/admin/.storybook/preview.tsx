import "../app/app.css";

import type { Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

const preview: Preview = {
  decorators: [
    (Story) => (
      // <Link />コンポーネントを使用できるようにする
      <MemoryRouter>
        <div className="bg-base-300 min-h-dvh">
          <div className="container mx-auto h-full min-h-dvh max-w-md p-4">
            <Story />
          </div>
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
