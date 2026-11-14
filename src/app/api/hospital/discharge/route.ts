import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {restoreSession} from "@/lib/auth/session";
import {getActiveRunId,requestHash} from "@/lib/server/action-game";
import {getPrivilegedDatabase} from "@/lib/server/database";
import {safeErrorResponse} from "@/lib/errors";
const schema=z.object({idempotencyKey:z.uuid()});
export async function POST(request:NextRequest){try{const player=await restoreSession();if(!player)return NextResponse.json({code:"UNAUTHENTICATED",message:"Sign in again."},{status:401});const input=schema.parse(await request.json()),runId=await getActiveRunId(),db=getPrivilegedDatabase();const{data,error}=await db.rpc("use_discharge_pill",{p_actor:player.id,p_run:runId,p_idempotency_key:input.idempotencyKey,p_request_hash:requestHash(input)});if(error)throw error;return NextResponse.json(data);}catch(error){const safe=safeErrorResponse(error);return NextResponse.json({code:safe.code,message:safe.message},{status:safe.status})}}
