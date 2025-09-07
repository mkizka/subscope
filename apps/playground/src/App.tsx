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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      repo: agent.session!.did,
      collection: "me.subsco.sync.subscription",
      record: {
        appviewDid: "did:web:appview.localhost",
        createdAt: new Date().toISOString(),
        inviteCode: "localhost-sreuv",
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
