export interface IAtPassport {
  // 戻り値は @passport のURLと Set-Cookie ヘッダーの値
  start: () => Promise<{ url: string; setCookie: string }>;
  // Cookieと一致しない戻りや、ハンドルを含まない戻りは null
  finish: (url: string, cookieHeader: string | null) => Promise<string | null>;
}
