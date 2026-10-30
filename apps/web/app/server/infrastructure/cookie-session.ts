import { createCookieSessionStorage } from "react-router";

export class CookieSession {
  private readonly storage;

  constructor(cookieSecret: string, secure: boolean) {
    this.storage = createCookieSessionStorage<{ did: string }>({
      cookie: {
        name: "subscope_session",
        secrets: [cookieSecret],
        httpOnly: true,
        secure,
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      },
    });
  }

  async getDid(request: Request) {
    const session = await this.storage.getSession(
      request.headers.get("Cookie"),
    );
    return session.get("did");
  }

  async commit(did: string) {
    const session = await this.storage.getSession();
    session.set("did", did);
    return this.storage.commitSession(session);
  }

  async destroy(request: Request) {
    const session = await this.storage.getSession(
      request.headers.get("Cookie"),
    );
    return this.storage.destroySession(session);
  }
}
