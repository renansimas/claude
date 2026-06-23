import { NextResponse } from "next/server";
import { getGames, getParticipants, getPicks, getWeeks } from "@/lib/repo";
import { computeStandings } from "@/lib/scoring";

export async function GET() {
  const [participants, weeks, games, picks] = await Promise.all([
    getParticipants(),
    getWeeks(),
    getGames(),
    getPicks(),
  ]);

  const standings = computeStandings(participants, weeks, games, picks);

  return NextResponse.json({ standings });
}
