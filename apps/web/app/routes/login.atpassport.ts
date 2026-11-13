import { redirect } from "react-router";

import { di } from "@/app/server/di";

export const loader = async () => {
  const { url, setCookie } = await di.atPassport.start();
  return redirect(url, { headers: { "Set-Cookie": setCookie } });
};
