import { NextResponse } from "next/server";
import { getGames, getParticipants, getPicks, getWeeks } from "@/lib/repo";
import type { GameWithPicks } from "@/lib/types";

export async function GET() {
  const [participants, weeks, games, picks] = await Promise.all([
    getParticipants(),
    getWeeks(),
    getGames(),
    getPicks(),
  ]);

  const gamesWithPicks: GameWithPicks[] = games.map((game) => {
    const picksForGame = picks.filter((p) => p.gameId === game.id);
    const picksRecord: Record<string, string> = {};
    for (const pick of picksForGame) {
      picksRecord[pick.participantId] = pick.pickedTeam;
    }
    return { ...game, picks: picksRecord };
  });

  return NextResponse.json({
    weeks,
    games: gamesWithPicks,
    participants: participants.map((p) => ({ id: p.id, name: p.name })),
  });
}
