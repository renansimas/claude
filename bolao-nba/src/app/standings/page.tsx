"use client";

import { useEffect, useState } from "react";
import type { ParticipantScore } from "@/lib/types";

export default function StandingsPage() {
  const [standings, setStandings] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((res) => res.json())
      .then((data) => {
        setStandings(data.standings ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Classificação</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Participante</th>
            <th className="py-2 pr-4">Acertos</th>
            <th className="py-2 pr-4">Bônus solo</th>
            <th className="py-2 pr-4">Jogo bônus</th>
            <th className="py-2 pr-4">Bônus semanal</th>
            <th className="py-2 pr-4">Total</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.participantId} className="border-b">
              <td className="py-2 pr-4 font-medium">{s.name}</td>
              <td className="py-2 pr-4">{s.basePoints}</td>
              <td className="py-2 pr-4">{s.soloBonusPoints}</td>
              <td className="py-2 pr-4">{s.bonusGamePoints}</td>
              <td className="py-2 pr-4">{s.weeklyBonusPoints}</td>
              <td className="py-2 pr-4 font-bold">{s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
