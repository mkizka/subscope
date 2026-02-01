export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <form action="/oauth/login" method="POST">
        <div>
          <label>
            Handle:
            <input
              type="text"
              name="identifier"
              placeholder="you.bsky.social"
            />
          </label>
        </div>
        <button type="submit">Login with Bluesky</button>
      </form>
    </div>
  );
}
