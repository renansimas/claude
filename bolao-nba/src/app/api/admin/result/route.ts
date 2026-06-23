import { NextResponse } from "next/server";
import { getGames, getParticipants, setGameResult } from "@/lib/repo";

export async function POST(request: Request) {
  const body = await request.json();
  const { participantId, pin, gameId, winnerTeam } = body as {
    participantId?: string;
    pin?: string;
    gameId?: string;
    winnerTeam?: string;
  };

  if (!participantId || !pin || !gameId || !winnerTeam) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const participants = await getParticipants();
  const participant = participants.find((p) => p.id === participantId);
  if (!participant || participant.pin !== pin) {
    return NextResponse.json({ error: "PIN inválido" }, { status: 401 });
  }

  const games = await getGames();
  const game = games.find((g) => g.id === gameId);
  if (!game) {
    return NextResponse.json(
      { error: "Jogo não encontrado" },
      { status: 404 }
    );
  }

  if (winnerTeam !== game.teamHome && winnerTeam !== game.teamAway) {
    return NextResponse.json(
      { error: "Time vencedor inválido para este jogo" },
      { status: 400 }
    );
  }

  await setGameResult(gameId, winnerTeam);

  return NextResponse.json({ ok: true });
}
