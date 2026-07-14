import { BottomNav } from "@/components/bottom-nav";

export default function GamePage() {
  return (
    <main>
      <section className="card stack">
        <span className="badge">UI shell</span>
        <h1>Character</h1>

        <div className="metric-grid">
          <div className="metric"><span className="muted">HP</span><strong>100 / 100</strong></div>
          <div className="metric"><span className="muted">Level</span><strong>1</strong></div>
          <div className="metric"><span className="muted">Coins</span><strong>50</strong></div>
        </div>

        <div
          style={{
            minHeight: "20rem",
            display: "grid",
            placeItems: "center",
            border: "1px dashed var(--border)",
            borderRadius: "1rem",
          }}
        >
          Character render placeholder
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
