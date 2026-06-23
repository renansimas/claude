"use client";

import { useEffect, useState } from "react";
import {
  clearIdentity,
  loadIdentity,
  saveIdentity,
  type Identity,
} from "@/lib/client-identity";

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = loadIdentity();
      if (stored) setIdentity(stored);
    });
  }, []);

  function login(newIdentity: Identity) {
    saveIdentity(newIdentity);
    setIdentity(newIdentity);
  }

  function logout() {
    clearIdentity();
    setIdentity(null);
  }

  return { identity, login, logout };
}

type ParticipantOption = { id: string; name: string };

export default function IdentityBar() {
  const { identity, login, logout } = useIdentity();
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    fetch("/api/participants")
      .then((res) => res.json())
      .then((data) => {
        setParticipants(data.participants ?? []);
        if (data.participants?.length > 0) {
          setSelectedId(data.participants[0].id);
        }
      });
  }, []);

  function handleLogin() {
    const participant = participants.find((p) => p.id === selectedId);
    if (!participant || !pin) return;
    login({ participantId: participant.id, name: participant.name, pin });
    setPin("");
  }

  if (identity) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>Logado como {identity.name}</span>
        <button
          onClick={logout}
          className="rounded bg-gray-200 px-2 py-1 text-gray-800 hover:bg-gray-300"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded border px-2 py-1"
      >
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="password"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-20 rounded border px-2 py-1"
      />
      <button
        onClick={handleLogin}
        className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
      >
        Entrar
      </button>
    </div>
  );
}
