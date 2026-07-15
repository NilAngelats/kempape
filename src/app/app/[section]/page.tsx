import { notFound, redirect } from "next/navigation";
import { restoreSession } from "@/lib/auth/session";
import { getBootstrap } from "@/lib/server/bootstrap";
import {getActionsForCurrentPlayer,getActionPool,getDailyQuests}from"@/lib/server/action-game";import{ActionsScreen,PoolScreen,QuestsScreen}from"@/components/gameplay-screens";
const sections:Record<string,string>={actions:"Actions",store:"Store",quests:"Daily Quests","action-pool":"Action Pool",inventory:"Inventory",hospital:"Hospital"};
export const dynamic="force-dynamic";
export default async function Section({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections[section])notFound();const player=await restoreSession();if(!player)redirect('/login');const bootstrap=await getBootstrap(player);if(bootstrap.lifecycle.status!=='active')redirect('/app');if(section==="actions")return <ActionsScreen model={await getActionsForCurrentPlayer(player)}/>;if(section==="action-pool")return <PoolScreen model={await getActionPool(player)}/>;if(section==="quests")return <QuestsScreen model={await getDailyQuests(player)}/>;return <section className="card stack"><span className="badge">Future system</span><h1>{sections[section]}</h1><p>This system will be implemented in a later handoff.</p></section>}
