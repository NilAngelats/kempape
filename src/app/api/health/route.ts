import { NextResponse } from "next/server";
import { FESTIVAL_CONFIG } from "@/lib/game/config";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "kempape",
    festivalId: FESTIVAL_CONFIG.id,
    timestamp: new Date().toISOString(),
  });
}
