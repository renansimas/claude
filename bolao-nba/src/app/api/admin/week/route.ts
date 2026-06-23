import { NextResponse } from "next/server";
import { createGame, createWeek, getParticipants, getWeeks } from "@/lib/repo";

type GameInput = {
  date: string;
  time: string;
  teamHome: string;
  teamAway: string;
  isBonusGame: boolean;
};

export async function POST(request: Request) {
  const body = await request.json();
  const { participantId, pin, label, games } = body as {
    participantId?: string;
    pin?: string;
    label?: string;
    games?: GameInput[];
  };

  if (!participantId || !pin || !label || !games) {
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

  if (games.length < 1) {
    return NextResponse.json(
      { error: "É necessário pelo menos 1 jogo" },
      { status: 400 }
    );
  }

  const bonusGames = games.filter((g) => g.isBonusGame);
  if (bonusGames.length !== 1) {
    return NextResponse.json(
      { error: "É necessário marcar exatamente 1 jogo bônus" },
      { status: 400 }
    );
  }

  const existingWeeks = await getWeeks();
  const nextWeekNumber =
    existingWeeks.length > 0
      ? Math.max(...existingWeeks.map((w) => w.weekNumber)) + 1
      : 1;

  const week = await createWeek({
    weekNumber: nextWeekNumber,
    curatorId: participantId,
    label,
  });

  const createdGames = [];
  for (const g of games) {
    const game = await createGame({
      weekId: week.id,
      date: g.date,
      time: g.time,
      teamHome: g.teamHome,
      teamAway: g.teamAway,
      isBonusGame: g.isBonusGame,
    });
    createdGames.push(game);
  }

  return NextResponse.json({ week, games: createdGames });
}
