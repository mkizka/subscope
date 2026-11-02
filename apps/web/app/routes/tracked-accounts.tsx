import { redirect } from "react-router";

export const loader = () => redirect("/accounts?tab=tracked");
