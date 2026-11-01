import type { ShouldRevalidateFunction } from "react-router";

const PANEL_PARAMS = ["profile"];

const withoutPanelParams = (url: URL) => {
  const params = new URLSearchParams(url.search);
  for (const name of PANEL_PARAMS) params.delete(name);
  return `${url.pathname}?${params}`;
};

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) =>
  !formMethod &&
  currentUrl.href !== nextUrl.href &&
  withoutPanelParams(currentUrl) === withoutPanelParams(nextUrl)
    ? false
    : defaultShouldRevalidate;
