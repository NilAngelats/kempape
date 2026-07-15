import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {getCurrentAppState}from"@/lib/server/app-state";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const{session,bootstrap}=await getCurrentAppState();if(session.kind==='invalid')redirect('/auth/clear-session');if(session.kind==='missing'||!bootstrap)redirect('/login');return <AppShell player={session.player} corePlayer={bootstrap.corePlayer}>{children}</AppShell>}
