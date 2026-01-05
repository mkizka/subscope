export function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <ul>
        <li>
          <a href="/login">Login</a>
        </li>
        <li>
          <form action="/oauth/logout" method="POST" style={{ display: "inline" }}>
            <button type="submit">Logout</button>
          </form>
        </li>
        <li>
          <a href="/admin">Go to Admin</a>
        </li>
        <li>
          <a href="/dashboard" target="_blank">
            Go to Dashboard
          </a>
        </li>
      </ul>
    </div>
  );
}
