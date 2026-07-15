import type { ReactNode } from "react";
import type { AuthenticatedPlayer } from "@/lib/auth/session";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import type { CorePlayerReadModel } from "@/lib/server/bootstrap";
export function AppShell({player,corePlayer,children}:{player:AuthenticatedPlayer;corePlayer:CorePlayerReadModel|null;children:ReactNode}){return <div className="app-frame"><header className="topbar"><div><span className="eyebrow">Kempape</span><strong>{player.displayName}</strong></div>{corePlayer&&<div className="shell-stats" aria-label="Player status"><span>Lv {corePlayer.level}</span><span>{corePlayer.currentHp}/{corePlayer.maxHp} HP</span><span>{corePlayer.coins} coins</span></div>}<LogoutButton /></header><main className="app-content">{children}</main><BottomNav/><div id="overlay-root" /></div>}
