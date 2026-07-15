import { redirect } from "next/navigation";
import { getSessionValidation } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { getBootstrap } from "@/lib/server/bootstrap";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const session=await getSessionValidation();if(session.kind==='invalid')redirect('/auth/clear-session');if(session.kind==='missing')redirect('/login');const bootstrap=await getBootstrap(session.player);return <AppShell player={session.player} corePlayer={bootstrap.corePlayer}>{children}</AppShell>}
