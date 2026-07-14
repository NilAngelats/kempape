const items = [
  ["Character", "⌂"],
  ["Actions", "⚔"],
  ["Store", "▣"],
  ["Quests", "▤"],
  ["Pool", "✊"],
] as const;

export function BottomNav() {
  return (
    <nav className="nav" aria-label="Primary navigation">
      {items.map(([label, icon], index) => (
        <a
          href="#"
          aria-current={index === 0 ? "page" : undefined}
          key={label}
        >
          <span aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
