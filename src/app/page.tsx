import Link from "next/link";
import { FESTIVAL_CONFIG } from "@/lib/game/config";
import { getFestivalCycleKey, getFestivalState } from "@/lib/game/time";

export default function HomePage() {
  const now = new Date();
  const state = getFestivalState(now);
  const cycle = getFestivalCycleKey(now);

  return (
    <main className="stack">
      <section className="card stack">
        <span className="badge">Kempape MVP foundation</span>
        <h1>Kempape 2026</h1>
        <p className="muted">
          Private six-player festival game.
        </p>

        <div className="metric-grid">
          <div className="metric">
            <span className="muted">State</span>
            <strong>{state}</strong>
          </div>
          <div className="metric">
            <span className="muted">Cycle</span>
            <strong>{cycle ?? "—"}</strong>
          </div>
          <div className="metric">
            <span className="muted">Timezone</span>
            <strong>{FESTIVAL_CONFIG.timeZone}</strong>
          </div>
        </div>

        <p>
          Starts: <strong>{FESTIVAL_CONFIG.startsAt}</strong>
          <br />
          Ends: <strong>{FESTIVAL_CONFIG.endsAt}</strong>
        </p>

        <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
          <Link className="button" href="/login">Enter invite code</Link>
          <Link className="button secondary" href="/game">Open UI shell</Link>
        </div>
      </section>
    </main>
  );
}
