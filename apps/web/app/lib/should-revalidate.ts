import type { ShouldRevalidateFunction } from "react-router";

const withoutPanelParams = (url: URL) => {
  const params = new URLSearchParams(url.search);
  params.delete("thread");
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
