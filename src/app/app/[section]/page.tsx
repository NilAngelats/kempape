import { notFound, redirect } from "next/navigation";
import { restoreSession } from "@/lib/auth/session";
import { getBootstrap } from "@/lib/server/bootstrap";
const sections:Record<string,string>={actions:"Actions",store:"Store",quests:"Daily Quests","action-pool":"Action Pool",inventory:"Inventory",hospital:"Hospital"};
export const dynamic="force-dynamic";
export default async function Placeholder({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections[section])notFound();const player=await restoreSession();if(!player)redirect('/login');const bootstrap=await getBootstrap(player);if(bootstrap.lifecycle.status!=='active')redirect('/app');return <section className="card stack"><span className="badge">Future system</span><h1>{sections[section]}</h1><p>This system will be implemented in a later handoff.</p></section>}
