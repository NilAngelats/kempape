import { redirect } from "next/navigation";
import { getSessionValidation } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const session=await getSessionValidation();if(session.kind==='invalid')redirect('/auth/clear-session');if(session.kind==='missing')redirect('/login');return <AppShell player={session.player}>{children}</AppShell>}
