import { AtpAgent } from "@atproto/api";
import { required } from "@repo/common/utils";

export function App() {
  const createSubscriptionRecord = async () => {
    const agent = new AtpAgent({
      service: "http://localhost:2583",
    });

    await agent.login({
      identifier: "alice.test",
      password: "hunter2",
    });

    await agent.com.atproto.repo.createRecord({
      repo: required(agent.session).did,
      collection: "me.subsco.sync.subscription",
      record: {
        appviewDid: "did:web:appview.localhost",
        createdAt: new Date().toISOString(),
      },
    });

    alert("Subscription record created successfully!");
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
