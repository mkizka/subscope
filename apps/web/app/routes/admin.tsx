import { Outlet } from "react-router";

import { AdminLayout } from "@/app/features/admin/pages/admin";
import { adminRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/admin";

export const middleware: Route.MiddlewareFunction[] = [adminRequiredMiddleware];

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export default function Admin() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
