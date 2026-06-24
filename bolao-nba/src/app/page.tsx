"use client";

import { useEffect, useState } from "react";
import { useIdentity } from "@/components/IdentityBar";
import { loadIdentity } from "@/lib/client-identity";
import type { GameWithPicks, Week } from "@/lib/types";

type ParticipantOption = { id: string; name: string };

export default function HomePage() {
  const { identity } = useIdentity();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [games, setGames] = useState<GameWithPicks[]>([]);
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingGameId, setSubmittingGameId] = useState<string | null>(
    null
  );
  const [now, setNow] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/games");
    const data = await res.json();
    setWeeks(data.weeks ?? []);
    setGames(data.games ?? []);
    setParticipants(data.participants ?? []);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      setNow(Date.now());
      void loadData();
    });
    const interval = setInterval(() => {
      setNow(Date.now());
      void loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const latestWeek = weeks.reduce<Week | null>((latest, week) => {
    if (!latest || week.weekNumber > latest.weekNumber) return week;
    return latest;
  }, null);

  const weekGames = latestWeek
    ? games
        .filter((g) => g.weekId === latestWeek.id)
        .sort((a, b) =>
          `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
        )
    : [];

  async function handlePick(gameId: string, pickedTeam: string) {
    const currentIdentity = identity ?? loadIdentity();
    if (!currentIdentity) {
      setError("Faça login para enviar um palpite");
      return;
    }
    setError(null);
    setSubmittingGameId(gameId);
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: currentIdentity.participantId,
        pin: currentIdentity.pin,
        gameId,
        pickedTeam,
      }),
    });
    setSubmittingGameId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao enviar palpite");
      return;
    }
    await loadData();
  }

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!latestWeek) {
    return <p>Nenhuma semana criada ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">
        Semana {latestWeek.weekNumber} — {latestWeek.label}
      </h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {weekGames.map((game) => {
          const kickoff = new Date(`${game.date}T${game.time}:00`).getTime();
          const isPastKickoff = now !== null && now >= kickoff;

          return (
            <div
              key={game.id}
              className={`rounded border p-4 ${
                game.isBonusGame ? "border-yellow-400 bg-yellow-50" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                <span>
                  {game.date} {game.time}
                </span>
                {game.isBonusGame && (
                  <span className="font-semibold text-yellow-700">
                    Jogo bônus
                  </span>
                )}
                {game.status === "finished" && (
                  <span className="font-semibold text-green-700">
                    Vencedor: {game.winnerTeam}
                  </span>
                )}
              </div>

              <div className="mb-3 flex gap-2">
                {[game.teamHome, game.teamAway].map((team) => {
                  const myPick = identity
                    ? game.picks[identity.participantId]
                    : undefined;
                  const isSelected = myPick === team;
                  return (
                    <button
                      key={team}
                      disabled={
                        isPastKickoff || submittingGameId === game.id
                      }
                      onClick={() => handlePick(game.id, team)}
                      className={`flex-1 rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {team}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-gray-600">
                <p className="mb-1 font-semibold">Palpites:</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {participants.map((p) => (
                    <li key={p.id}>
                      {p.name}: {game.picks[p.id] ?? "—"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
