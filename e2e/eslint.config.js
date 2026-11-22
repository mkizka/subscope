import { config } from "@repo/eslint-config";

export default [...config, { rules: { "at-uri/no-split-uri": "off" } }];
