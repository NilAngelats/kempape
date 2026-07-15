import { redirect } from "next/navigation";
import { getSessionValidation } from "@/lib/auth/session";
export const dynamic="force-dynamic";
export default async function HomePage(){const session=await getSessionValidation();if(session.kind==='invalid')redirect('/auth/clear-session');redirect(session.kind==='valid'?'/app':'/login')}
