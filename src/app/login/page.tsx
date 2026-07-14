export default function LoginPage() {
  return (
    <main className="stack">
      <section className="card stack">
        <span className="badge">Private access</span>
        <h1>Enter your invite code</h1>
        <p className="muted">
          The server route for redeeming codes is the next implementation task.
        </p>
        <form className="stack">
          <label>
            <span className="muted">Invite code</span>
            <input
              className="field"
              name="inviteCode"
              autoComplete="one-time-code"
              placeholder="KMP-XXXX-XXXX-XXXX"
            />
          </label>
          <button className="button" type="submit" disabled>
            Enter
          </button>
        </form>
      </section>
    </main>
  );
}
