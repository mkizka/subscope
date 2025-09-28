import { AtpAgent } from "@atproto/api";
import { AtpBaseClient } from "@repo/client/api";

export function App() {
  const createSubscriptionRecord = async () => {
    const agent = new AtpAgent({
      service: "http://localhost:2583",
    });

    await agent.login({
      identifier: "alice.test",
      password: "hunter2",
    });

    const agent2 = new AtpBaseClient(async (url, init) => {
      const headers = new Headers(init.headers);
      headers.set("atproto-proxy", "did:web:localhost%3A3001#bsky_appview");
      return await agent.sessionManager.fetchHandler(url, { ...init, headers });
    });

    await agent2.me.subsco.sync.subscribeServer({
      inviteCode: "localhost-sreuv",
    });

    alert("Login successful!");
  };

  return (
    <div>
      <h1>Playground</h1>
      <button onClick={createSubscriptionRecord}>
        Create Subscription Record
      </button>
    </div>
  );
}
