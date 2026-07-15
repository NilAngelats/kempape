import type { ReactNode } from "react";
import type { AuthenticatedPlayer } from "@/lib/auth/session";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
export function AppShell({player,children}:{player:AuthenticatedPlayer;children:ReactNode}){return <div className="app-frame"><header className="topbar"><div><span className="eyebrow">Kempape</span><strong>{player.displayName}</strong></div><LogoutButton /></header><main className="app-content">{children}</main><BottomNav/><div id="overlay-root" /></div>}
