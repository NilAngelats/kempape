import"server-only";
import{cache}from"react";
import{getSessionValidation}from"@/lib/auth/session";
import{getBootstrap}from"@/lib/server/bootstrap";
import{processInventoryPassives}from"@/lib/server/inventory-game";
export const getCurrentAppState=cache(async()=>{const session=await getSessionValidation();if(session.kind!=="valid")return{session,bootstrap:null};let bootstrap=await getBootstrap(session.player);if(bootstrap.lifecycle.status==="active"){await processInventoryPassives(session.player);bootstrap=await getBootstrap(session.player)}return{session,bootstrap}});
