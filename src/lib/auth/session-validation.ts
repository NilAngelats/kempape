export type SessionRecord = { id:string; player_id:string; session_version:number; last_seen_at:string; expires_at:string; revoked_at:string|null };
export type PlayerRecord = { id:string; display_name:string; role:"player"|"admin"; status:"active"|"disabled"; session_version:number; character_id:string };
export type CharacterRecord = { id:string; display_name:string; image_key:string; face_image_key:string|null };
export type SessionLookup = { findSession(tokenHash:string):Promise<SessionRecord|null>; findPlayer(id:string):Promise<PlayerRecord|null>; findCharacter(id:string):Promise<CharacterRecord|null> };
export type ValidatedPlayer = { id:string; displayName:string; role:"player"|"admin"; character:{id:string;displayName:string;imageKey:string;faceImageKey:string|null};sessionId:string };
export type SessionValidation = {kind:"missing"}|{kind:"invalid";reason:"malformed"|"expired"|"revoked"|"version_invalid"|"player_disabled"|"orphaned"}|{kind:"valid";player:ValidatedPlayer;lastSeenAt:string};

export async function validateSessionToken(token:string|undefined,hash:(value:string)=>string,lookup:SessionLookup,now=new Date()):Promise<SessionValidation>{
  if(!token)return {kind:"missing"};
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return {kind:"invalid",reason:"malformed"};
  const session=await lookup.findSession(hash(token));
  if(!session)return {kind:"invalid",reason:"orphaned"};
  if(session.revoked_at)return {kind:"invalid",reason:"revoked"};
  if(Date.parse(session.expires_at)<=now.getTime())return {kind:"invalid",reason:"expired"};
  const player=await lookup.findPlayer(session.player_id);
  if(!player)return {kind:"invalid",reason:"orphaned"};
  if(player.status!=="active")return {kind:"invalid",reason:"player_disabled"};
  if(player.session_version!==session.session_version)return {kind:"invalid",reason:"version_invalid"};
  const character=await lookup.findCharacter(player.character_id);
  if(!character)return {kind:"invalid",reason:"orphaned"};
  return {kind:"valid",lastSeenAt:session.last_seen_at,player:{id:player.id,displayName:player.display_name,role:player.role,sessionId:session.id,character:{id:character.id,displayName:character.display_name,imageKey:character.image_key,faceImageKey:character.face_image_key}}};
}
