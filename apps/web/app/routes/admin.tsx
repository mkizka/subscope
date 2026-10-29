import { Outlet } from "react-router";

import { adminRequiredMiddleware } from "@/app/middlewares/auth";
import { AdminPage } from "@/app/pages/admin/admin-page";

import type { Route } from "./+types/admin";

export const middleware: Route.MiddlewareFunction[] = [adminRequiredMiddleware];

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export default function Admin() {
  return (
    <AdminPage>
      <Outlet />
    </AdminPage>
  );
}
