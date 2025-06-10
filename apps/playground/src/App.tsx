import { AtpAgent } from "@atproto/api";

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
      repo: agent.session!.did,
      collection: "dev.mkizka.test.subscription",
      record: {
        appviewDid: "did:web:localhost%3A3000",
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
