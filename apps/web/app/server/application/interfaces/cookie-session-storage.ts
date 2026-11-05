export interface ICookieSessionStorage {
  getDid: (cookieHeader: string | null) => Promise<string | null>;
  // 戻り値は Set-Cookie ヘッダーの値
  commit: (cookieHeader: string | null, did: string) => Promise<string>;
  destroy: (cookieHeader: string | null) => Promise<string>;
}
