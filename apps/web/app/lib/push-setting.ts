import { fetchJson } from "./fetch-json";

export type PushSettingState =
  "unavailable" | "unsupported" | "denied" | "on" | "off";

const ENDPOINT = "/api/push-subscription";

const fetchPublicKey = async () =>
  (await fetchJson<{ publicKey: string | null }>(ENDPOINT)).publicKey;

const findSubscription = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
};

const request = async (method: string, body: unknown) => {
  const response = await fetch(ENDPOINT, {
    method,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${ENDPOINT} failed`);
};

export const fetchPushSettingState = async (): Promise<PushSettingState> => {
  if (!(await fetchPublicKey())) return "unavailable";
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  const permission = await navigator.permissions.query({
    name: "notifications",
  });
  if (permission.state === "denied") return "denied";
  return (await findSubscription()) ? "on" : "off";
};

export const enablePush = async () => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  const publicKey = await fetchPublicKey();
  if (!publicKey) return permission;
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });
  try {
    await request("POST", subscription.toJSON());
  } catch (e) {
    await subscription.unsubscribe();
    throw e;
  }
  return permission;
};

export const disablePush = async () => {
  const subscription = await findSubscription();
  if (!subscription) return;
  await subscription.unsubscribe();
  await request("DELETE", { endpoint: subscription.endpoint });
};
