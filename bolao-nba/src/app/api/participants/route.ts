import { NextResponse } from "next/server";
import { getParticipants } from "@/lib/repo";

export async function GET() {
  const participants = await getParticipants();
  return NextResponse.json({
    participants: participants.map((p) => ({ id: p.id, name: p.name })),
  });
}
