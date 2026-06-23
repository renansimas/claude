import { NextResponse } from "next/server";
import { getGames, getParticipants, submitPick } from "@/lib/repo";

export async function POST(request: Request) {
  const body = await request.json();
  const { participantId, pin, gameId, pickedTeam } = body as {
    participantId?: string;
    pin?: string;
    gameId?: string;
    pickedTeam?: string;
  };

  if (!participantId || !pin || !gameId || !pickedTeam) {
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

  if (pickedTeam !== game.teamHome && pickedTeam !== game.teamAway) {
    return NextResponse.json(
      { error: "Time escolhido inválido para este jogo" },
      { status: 400 }
    );
  }

  const kickoff = new Date(`${game.date}T${game.time}:00`);
  if (Date.now() >= kickoff.getTime()) {
    return NextResponse.json(
      { error: "Prazo para palpite encerrado" },
      { status: 403 }
    );
  }

  const pick = await submitPick({ gameId, participantId, pickedTeam });

  return NextResponse.json({ pick });
}
