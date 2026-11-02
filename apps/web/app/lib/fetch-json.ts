export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (response.redirected) {
    window.location.assign(response.url);
  }
  if (!response.ok) {
    throw new Error(`${url}の取得に失敗しました`);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<T>;
}
