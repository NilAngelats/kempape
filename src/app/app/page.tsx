import Link from "next/link";
import { redirect } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { restoreSession } from "@/lib/auth/session";
import { FESTIVAL_CONFIG } from "@/lib/game/config";
import { getBootstrap } from "@/lib/server/bootstrap";
import { getEquippedSlots, processInventoryPassives } from "@/lib/server/inventory-game";
export const dynamic = "force-dynamic";

export default async function AppHome(){
  const player=await restoreSession(); if(!player)redirect("/login");
  let data=await getBootstrap(player);
  if(data.lifecycle.status==="active"){await processInventoryPassives(player);data=await getBootstrap(player)}
  if(data.lifecycle.status==="unavailable")return <section className="card stack lifecycle"><span className="badge warning">Unavailable</span><h1>Game run unavailable</h1><p className="muted">No authoritative active game run is available. Please retry or contact an administrator.</p></section>;
  if(data.lifecycle.status==="before_start"&&data.lifecycle.startsAt){const startLabel=new Intl.DateTimeFormat("en-GB",{dateStyle:"long",timeStyle:"short",timeZone:FESTIVAL_CONFIG.timeZone}).format(new Date(data.lifecycle.startsAt));return <section className="card stack lifecycle"><span className="badge">Festival begins soon</span><h1>{player.character.displayName}</h1><p>Welcome, {player.displayName}. Gameplay has not started.</p><Countdown target={data.lifecycle.startsAt} serverNow={data.lifecycle.serverNow}/><p className="muted">Starts {startLabel} ({FESTIVAL_CONFIG.timeZone}).</p></section>;}
  if(data.lifecycle.status==="paused")return <section className="card stack lifecycle"><span className="badge warning">Global pause</span><h1>The festival is paused</h1><p>{player.displayName}, all gameplay interactions are temporarily unavailable. Timers are frozen.</p></section>;
  if(data.lifecycle.status==="chaos_resolution")return <section className="card stack lifecycle"><span className="badge warning">Chaos resolution</span><h1>Normal gameplay has ended</h1><p className="muted">Only eligible pending Chaos resolution operations remain available until the run closes.</p></section>;
  if(data.lifecycle.status==="ended")return <section className="card stack lifecycle"><span className="badge">Read only</span><h1>The festival is complete</h1><p>Thanks for playing, {player.displayName}.</p></section>;
  const core=data.corePlayer;
  if(!core)return <section className="card stack lifecycle"><h1>Player state unavailable</h1><p className="muted">Your run assignment could not be loaded. Please retry shortly.</p></section>;
  const equipment=await getEquippedSlots(player,false);
  return <section className="stack">
    <div className="card hero"><div><span className="eyebrow">Assigned character</span><h1>{player.character.displayName}</h1><p className="muted">{core.displayName}</p><Link className="button secondary" href="/app/inventory">Open Inventory</Link></div></div>
    <div className="metric-grid"><div className="metric"><span className="muted">Level</span><strong>{core.isMaxLevel?"40 — MAX":core.level}</strong></div><div className="metric"><span className="muted">Health</span><strong>{core.currentHp} / {core.maxHp} HP</strong></div><div className="metric"><span className="muted">Coins</span><strong>{core.coins}</strong></div></div>
    <section className="card stack stat-bars"><div><div className="bar-label"><strong>HP</strong><span>{core.currentHp} / {core.maxHp}</span></div><progress className="bar hp" max="100" value={core.hpProgressPercentage}/></div><div><div className="bar-label"><strong>XP</strong><span>{core.isMaxLevel?"MAX LEVEL":`${core.xpIntoCurrentLevel} / ${core.xpNeededForNextLevel}`}</span></div><progress className="bar xp" max="100" value={core.xpProgressPercentage}/></div></section>
    <section className="card stack"><h2>Equipped</h2><div className="metric-grid">{equipment.slots.map(({slot,item})=><Link href="/app/inventory" className="metric" key={slot}><span className="muted">{slot[0].toUpperCase()+slot.slice(1)}</span><strong>{item?.definition?.name??"Empty"}</strong></Link>)}</div><p className="muted">Standalone slot art is used until approved on-character layers exist.</p></section>
  </section>;
}
