import{notFound,redirect}from"next/navigation";
import{getCurrentAppState}from"@/lib/server/app-state";
import{getActionsForCurrentPlayer,getActionPool,getDailyQuests}from"@/lib/server/action-game";
import{ActionsScreen,PoolScreen,QuestsScreen}from"@/components/gameplay-screens";
import{getHospitalView,getInventory}from"@/lib/server/inventory-game";
import{InventoryScreen}from"@/components/inventory-screen";
import{HospitalScreen}from"@/components/hospital-screen";
const sections:Record<string,string>={actions:"Actions",store:"Store",quests:"Daily Quests","action-pool":"Action Pool",inventory:"Inventory",hospital:"Hospital"};
export const dynamic="force-dynamic";
export default async function Section({params}:{params:Promise<{section:string}>}){const{section}=await params;if(!sections[section])notFound();const{session,bootstrap}=await getCurrentAppState();if(session.kind!=="valid"||!bootstrap)redirect("/login");const player=session.player;if(bootstrap.lifecycle.status!=="active")redirect("/app");if(section==="actions")return <ActionsScreen model={await getActionsForCurrentPlayer(player)}/>;if(section==="action-pool")return <PoolScreen model={await getActionPool(player)}/>;if(section==="quests")return <QuestsScreen model={await getDailyQuests(player)}/>;if(section==="inventory")return <InventoryScreen model={await getInventory(player,false)}/>;if(section==="hospital")return <HospitalScreen model={await getHospitalView(player)}/>;return <section className="card stack"><span className="badge">Future system</span><h1>{sections[section]}</h1><p>This system will be implemented in a later handoff.</p></section>}
