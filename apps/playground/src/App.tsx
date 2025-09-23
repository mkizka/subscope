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
