import flyonui from "flyonui";
// @ts-expect-error
import flyonuiPlugin from "flyonui/plugin";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./node_modules/flyonui/dist/js/*.js"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [flyonui, flyonuiPlugin],
};
export default config;
