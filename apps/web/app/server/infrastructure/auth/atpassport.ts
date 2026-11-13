import { AtPassport } from "@atpassport/client";
import { createCookie } from "react-router";

import type { IAtPassport } from "@/app/server/application/interfaces/atpassport";
import type { Env } from "@/app/server/env";

export const atPassportFactory = ({
  env,
}: {
  env: Pick<Env, "COOKIE_SECRET" | "NODE_ENV" | "PUBLIC_URL">;
}): IAtPassport => {
  const client = new AtPassport({
    callbackUrl: new URL("/login/atpassport/callback", env.PUBLIC_URL).href,
    lang: "ja",
  });
  const cookie = createCookie("subscope_atpstate", {
    secrets: [env.COOKIE_SECRET],
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 5 * 60,
    sameSite: "lax",
  });
  return {
    async start() {
      const { url, atpstate } = client.generateAuthUrl();
      return { url, setCookie: await cookie.serialize(atpstate) };
    },
    async finish(url, cookieHeader) {
      const expected: unknown = await cookie.parse(cookieHeader);
      if (typeof expected !== "string" || !expected) return null;
      try {
        return client.parseCallback(url, expected).handle;
      } catch {
        return null;
      }
    },
  };
};
