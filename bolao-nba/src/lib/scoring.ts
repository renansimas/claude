import type { Game, Participant, ParticipantScore, Pick, Week } from "./types";

export function computeStandings(
  participants: Participant[],
  weeks: Week[],
  games: Game[],
  picks: Pick[]
): ParticipantScore[] {
  const scores = new Map<string, ParticipantScore>();
  for (const p of participants) {
    scores.set(p.id, {
      participantId: p.id,
      name: p.name,
      basePoints: 0,
      soloBonusPoints: 0,
      bonusGamePoints: 0,
      weeklyBonusPoints: 0,
      total: 0,
    });
  }

  const finishedGames = games.filter(
    (g) => g.status === "finished" && g.winnerTeam
  );

  // Rule 1 & 2: base points + solo bonus
  for (const game of finishedGames) {
    const picksForGame = picks.filter((p) => p.gameId === game.id);
    const correctPicks = picksForGame.filter(
      (p) => p.pickedTeam === game.winnerTeam
    );

    for (const pick of correctPicks) {
      const score = scores.get(pick.participantId);
      if (!score) continue;
      score.basePoints += 1;

      if (correctPicks.length === 1) {
        score.soloBonusPoints += 1;
      }

      if (game.isBonusGame) {
        score.bonusGamePoints += 1;
      }
    }
  }

  // Rule 4: weekly bonus - only when all 7 games of the week are finished
  for (const week of weeks) {
    const weekGames = games.filter((g) => g.weekId === week.id);
    if (weekGames.length === 0) continue;
    const allFinished = weekGames.every(
      (g) => g.status === "finished" && g.winnerTeam
    );
    if (!allFinished) continue;

    for (const participant of participants) {
      const misses = weekGames.filter((g) => {
        const pick = picks.find(
          (p) => p.gameId === g.id && p.participantId === participant.id
        );
        return !pick || pick.pickedTeam !== g.winnerTeam;
      }).length;

      if (misses <= 1) {
        const score = scores.get(participant.id);
        if (score) score.weeklyBonusPoints += 2;
      }
    }
  }

  for (const score of scores.values()) {
    score.total =
      score.basePoints +
      score.soloBonusPoints +
      score.bonusGamePoints +
      score.weeklyBonusPoints;
  }

  return Array.from(scores.values()).sort((a, b) => b.total - a.total);
}
