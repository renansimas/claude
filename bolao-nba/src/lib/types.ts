export type Participant = {
  id: string;
  name: string;
  pin: string;
};

export type Week = {
  id: string;
  weekNumber: number;
  curatorId: string;
  label: string;
};

export type GameStatus = "scheduled" | "finished";

export type Game = {
  id: string;
  weekId: string;
  date: string;
  time: string;
  teamHome: string;
  teamAway: string;
  isBonusGame: boolean;
  winnerTeam: string;
  status: GameStatus;
};

export type Pick = {
  id: string;
  gameId: string;
  participantId: string;
  pickedTeam: string;
  submittedAt: string;
};

export type GameWithPicks = Game & {
  picks: Record<string, string>;
};

export type ParticipantScore = {
  participantId: string;
  name: string;
  basePoints: number;
  soloBonusPoints: number;
  bonusGamePoints: number;
  weeklyBonusPoints: number;
  total: number;
};
