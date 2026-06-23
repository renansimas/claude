import { appendRow, readSheet, updateRowById } from "./sheets";
import type { Game, GameStatus, Participant, Pick, Week } from "./types";

export const HEADERS = {
  Participants: ["id", "name", "pin"],
  Weeks: ["id", "weekNumber", "curatorId", "label"],
  Games: [
    "id",
    "weekId",
    "date",
    "time",
    "teamHome",
    "teamAway",
    "isBonusGame",
    "winnerTeam",
    "status",
  ],
  Picks: ["id", "gameId", "participantId", "pickedTeam", "submittedAt"],
} as const;

function rowsToObjects<T>(headers: readonly string[], rows: string[][]): T[] {
  const [, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj as T;
    });
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getParticipants(): Promise<Participant[]> {
  const rows = await readSheet("Participants");
  return rowsToObjects<Participant>(HEADERS.Participants, rows);
}

export async function getWeeks(): Promise<Week[]> {
  const rows = await readSheet("Weeks");
  const weeks = rowsToObjects<
    Omit<Week, "weekNumber"> & { weekNumber: string }
  >(HEADERS.Weeks, rows);
  return weeks.map((w) => ({ ...w, weekNumber: Number(w.weekNumber) }));
}

export async function getGames(): Promise<Game[]> {
  const rows = await readSheet("Games");
  const games = rowsToObjects<
    Omit<Game, "isBonusGame"> & { isBonusGame: string }
  >(HEADERS.Games, rows);
  return games.map((g) => ({
    ...g,
    isBonusGame: g.isBonusGame === "true" || g.isBonusGame === "TRUE",
  }));
}

export async function getPicks(): Promise<Pick[]> {
  const rows = await readSheet("Picks");
  return rowsToObjects<Pick>(HEADERS.Picks, rows);
}

export async function createWeek(input: {
  weekNumber: number;
  curatorId: string;
  label: string;
}): Promise<Week> {
  const week: Week = {
    id: genId(),
    weekNumber: input.weekNumber,
    curatorId: input.curatorId,
    label: input.label,
  };
  await appendRow("Weeks", [...HEADERS.Weeks], week);
  return week;
}

export async function createGame(input: {
  weekId: string;
  date: string;
  time: string;
  teamHome: string;
  teamAway: string;
  isBonusGame: boolean;
}): Promise<Game> {
  const game: Game = {
    id: genId(),
    weekId: input.weekId,
    date: input.date,
    time: input.time,
    teamHome: input.teamHome,
    teamAway: input.teamAway,
    isBonusGame: input.isBonusGame,
    winnerTeam: "",
    status: "scheduled",
  };
  await appendRow("Games", [...HEADERS.Games], game);
  return game;
}

export async function setGameResult(
  gameId: string,
  winnerTeam: string
): Promise<boolean> {
  const status: GameStatus = "finished";
  return updateRowById("Games", [...HEADERS.Games], "id", gameId, {
    winnerTeam,
    status,
  });
}

export async function submitPick(input: {
  gameId: string;
  participantId: string;
  pickedTeam: string;
}): Promise<Pick> {
  const existingPicks = await getPicks();
  const existing = existingPicks.find(
    (p) =>
      p.gameId === input.gameId && p.participantId === input.participantId
  );

  const submittedAt = new Date().toISOString();

  if (existing) {
    await updateRowById("Picks", [...HEADERS.Picks], "id", existing.id, {
      pickedTeam: input.pickedTeam,
      submittedAt,
    });
    return { ...existing, pickedTeam: input.pickedTeam, submittedAt };
  }

  const pick: Pick = {
    id: genId(),
    gameId: input.gameId,
    participantId: input.participantId,
    pickedTeam: input.pickedTeam,
    submittedAt,
  };
  await appendRow("Picks", [...HEADERS.Picks], pick);
  return pick;
}
