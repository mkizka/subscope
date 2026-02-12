import "@/app/app.css";

import type { Preview } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";

const preview: Preview = {
  decorators: (Story) => (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  ),
};

export default preview;
