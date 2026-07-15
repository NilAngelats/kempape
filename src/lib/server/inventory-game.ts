import "server-only";
import type { AuthenticatedPlayer } from "@/lib/auth/session";
import { getPrivilegedDatabase } from "@/lib/server/database";
import { EQUIPMENT_DEFINITIONS, CONSUMABLES, CHAOS_CARDS } from "@/lib/game/items";
import { getActiveRunId } from "@/lib/server/action-game";

export async function getInventory(player:AuthenticatedPlayer){const db=getPrivilegedDatabase(),runId=await getActiveRunId();const{data,error}=await db.rpc("get_inventory_snapshot",{p_run:runId,p_player:player.id});if(error&&error.code!=="PGRST202")throw error;const snapshot=(data??{serverNow:new Date().toISOString(),equipment:[],stacks:[]})as any;const stack=new Map<string,number>((snapshot.stacks??[]).map((v:any)=>[`${v.category}:${v.itemId}`,v.quantity]));return{runId,serverNow:snapshot.serverNow,equipment:(snapshot.equipment??[]).map((item:any)=>({...item,definition:EQUIPMENT_DEFINITIONS.find(d=>d.id===item.definitionId)??null})),consumables:CONSUMABLES.map(d=>({...d,quantity:stack.get(`consumable:${d.id}`)??0})),chaosCards:CHAOS_CARDS.map(d=>({...d,quantity:stack.get(`chaos_card:${d.id}`)??0}))};}

export async function getEquippedSlots(player:AuthenticatedPlayer){const model=await getInventory(player);return{serverNow:model.serverNow,slots:["helmet","armor","legs","boots"].map(slot=>({slot,item:model.equipment.find((i:any)=>i.equipped&&i.slot===slot)??null}))};}
