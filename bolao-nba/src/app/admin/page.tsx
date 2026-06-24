"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useIdentity } from "@/components/IdentityBar";
import { loadIdentity } from "@/lib/client-identity";
import { NBA_TEAMS, teamLogoUrl } from "@/lib/nba-teams";
import type { GameWithPicks } from "@/lib/types";

type GameRowInput = {
  date: string;
  time: string;
  teamHome: string;
  teamAway: string;
};

const EMPTY_GAME_ROW: GameRowInput = {
  date: "",
  time: "",
  teamHome: "",
  teamAway: "",
};

function makeEmptyRows(count: number): GameRowInput[] {
  return Array.from({ length: count }, () => ({ ...EMPTY_GAME_ROW }));
}

export default function AdminPage() {
  const { identity } = useIdentity();
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<GameRowInput[]>(makeEmptyRows(7));
  const [bonusIndex, setBonusIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [games, setGames] = useState<GameWithPicks[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [resultError, setResultError] = useState<string | null>(null);
  const [submittingResultId, setSubmittingResultId] = useState<string | null>(
    null
  );

  async function loadGames() {
    setLoadingGames(true);
    const res = await fetch("/api/games");
    const data = await res.json();
    setGames(data.games ?? []);
    setLoadingGames(false);
  }

  useEffect(() => {
    queueMicrotask(() => void loadGames());
  }, []);

  function updateRow(index: number, patch: Partial<GameRowInput>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  async function handleCreateWeek(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const currentIdentity = identity ?? loadIdentity();
    if (!currentIdentity) {
      setCreateError("Faça login para criar uma semana");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/admin/week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: currentIdentity.participantId,
        pin: currentIdentity.pin,
        label,
        games: rows.map((row, i) => ({
          ...row,
          isBonusGame: i === bonusIndex,
        })),
      }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = await res.json();
      setCreateError(data.error ?? "Erro ao criar semana");
      return;
    }

    setCreateSuccess("Semana criada com sucesso");
    setLabel("");
    setRows(makeEmptyRows(7));
    setBonusIndex(0);
    await loadGames();
  }

  async function handleSetResult(gameId: string, winnerTeam: string) {
    const currentIdentity = identity ?? loadIdentity();
    if (!currentIdentity) {
      setResultError("Faça login para marcar resultados");
      return;
    }
    setResultError(null);
    setSubmittingResultId(gameId);
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: currentIdentity.participantId,
        pin: currentIdentity.pin,
        gameId,
        winnerTeam,
      }),
    });
    setSubmittingResultId(null);

    if (!res.ok) {
      const data = await res.json();
      setResultError(data.error ?? "Erro ao marcar resultado");
      return;
    }
    await loadGames();
  }

  const pendingGames = games
    .filter((g) => g.status !== "finished")
    .sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
    );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">Criar nova semana</h1>
        <form onSubmit={handleCreateWeek} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Rótulo da semana (ex: Semana 1)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="rounded border px-3 py-2 text-sm"
          />

          <div className="flex flex-col gap-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded border p-2"
              >
                <input
                  type="radio"
                  name="bonusGame"
                  checked={bonusIndex === i}
                  onChange={() => setBonusIndex(i)}
                  title="Marcar como jogo bônus"
                />
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(i, { date: e.target.value })}
                  required
                  className="rounded border px-2 py-1 text-sm"
                />
                <input
                  type="time"
                  value={row.time}
                  onChange={(e) => updateRow(i, { time: e.target.value })}
                  required
                  className="rounded border px-2 py-1 text-sm"
                />
                <div className="flex items-center gap-1">
                  {row.teamHome && (
                    <Image
                      src={teamLogoUrl(row.teamHome)}
                      alt={row.teamHome}
                      width={24}
                      height={24}
                      unoptimized
                    />
                  )}
                  <select
                    value={row.teamHome}
                    onChange={(e) => updateRow(i, { teamHome: e.target.value })}
                    required
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="">Time casa</option>
                    {NBA_TEAMS.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <span>x</span>
                <div className="flex items-center gap-1">
                  {row.teamAway && (
                    <Image
                      src={teamLogoUrl(row.teamAway)}
                      alt={row.teamAway}
                      width={24}
                      height={24}
                      unoptimized
                    />
                  )}
                  <select
                    value={row.teamAway}
                    onChange={(e) => updateRow(i, { teamAway: e.target.value })}
                    required
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="">Time visitante</option>
                    {NBA_TEAMS.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}
          {createSuccess && (
            <p className="text-sm text-green-700">{createSuccess}</p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="self-start rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar semana"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Jogos pendentes</h2>
        {resultError && <p className="text-sm text-red-600">{resultError}</p>}
        {loadingGames ? (
          <p>Carregando...</p>
        ) : pendingGames.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum jogo pendente.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingGames.map((game) => (
              <div
                key={game.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
              >
                <span>
                  {game.date} {game.time} — {game.teamHome} x{" "}
                  {game.teamAway}
                  {game.isBonusGame && (
                    <span className="ml-2 font-semibold text-yellow-700">
                      (bônus)
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  {[game.teamHome, game.teamAway].map((team) => (
                    <button
                      key={team}
                      disabled={submittingResultId === game.id}
                      onClick={() => handleSetResult(game.id, team)}
                      className="flex items-center gap-1 rounded border px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {teamLogoUrl(team) && (
                        <Image
                          src={teamLogoUrl(team)}
                          alt={team}
                          width={20}
                          height={20}
                          unoptimized
                        />
                      )}
                      {team} venceu
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
