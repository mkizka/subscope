import { redirect } from "react-router";

export const loader = () => redirect("/server?tab=tracked");
