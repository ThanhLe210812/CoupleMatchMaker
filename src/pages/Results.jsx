import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Swords, Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLang } from "@/components/LangContext";
import { computeGroupStandings } from "@/components/standings";

const posStyles = [
  "bg-yellow-400 text-white",
  "bg-slate-300 text-white",
  "bg-amber-600 text-white",
];

function GroupStandingsTable({ groupIndex, standings, t }) {
  const groupColors = [
    "text-indigo-600", "text-violet-600", "text-fuchsia-600",
    "text-rose-600", "text-amber-600", "text-emerald-600",
  ];
  const color = groupColors[groupIndex % groupColors.length];

  return (
    <div className="mb-4">
      <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${color}`}>
        {t("group")} {groupIndex + 1}
      </p>
      <div className="rounded-xl overflow-hidden border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500 w-7">{t("pos")}</th>
              <th className="text-left px-2 py-2 text-xs font-semibold text-slate-500">{t("playerTeam")}</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-slate-500">{t("matchesPlayed")}</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-slate-500">{t("w")}</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-slate-500">{t("l")}</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-slate-400">D</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-green-600">+</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-red-400">-</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-slate-600">+/-</th>
              <th className="text-center px-1 py-2 text-xs font-semibold text-indigo-600">{t("pts")}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => (
              <tr key={s.name} className={`border-t border-slate-50 ${idx === 0 ? "bg-yellow-50/40" : idx === 1 ? "bg-slate-50/40" : ""}`}>
                <td className="px-2 py-2">
                  {idx < 3 ? (
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${posStyles[idx]}`}>
                      {idx + 1}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 pl-1">{idx + 1}</span>
                  )}
                </td>
                <td className="px-2 py-2 font-medium text-slate-800 max-w-[100px] truncate text-xs">{s.name}</td>
                <td className="px-1 py-2 text-center text-slate-500 text-xs">{s.mp}</td>
                <td className="px-1 py-2 text-center text-green-600 font-semibold text-xs">{s.w}</td>
                <td className="px-1 py-2 text-center text-red-400 font-semibold text-xs">{s.l}</td>
                <td className="px-1 py-2 text-center text-slate-400 text-xs">{s.d}</td>
                <td className="px-1 py-2 text-center text-green-500 text-xs">{s.scored}</td>
                <td className="px-1 py-2 text-center text-red-400 text-xs">{s.conceded}</td>
                <td className={`px-1 py-2 text-center font-semibold text-xs ${s.diff > 0 ? "text-green-600" : s.diff < 0 ? "text-red-500" : "text-slate-400"}`}>
                  {s.diff > 0 ? `+${s.diff}` : s.diff}
                </td>
                <td className="px-1 py-2 text-center font-bold text-indigo-600 text-xs">{s.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Results() {
  const { t } = useLang();
  const [search, setSearch] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });

  // Use localStorage to read active tournament id (set by Home page)
  const [activeTournamentId, setActiveTournamentId] = useState(() => {
    try { return localStorage.getItem("activeTournamentId") || null; } catch { return null; }
  });

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const sessionId = activeTournament?.session_id || activeTournamentId;

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", activeTournamentId],
    queryFn: () => sessionId ? base44.entities.Match.filter({ session_id: sessionId }) : Promise.resolve([]),
    enabled: !!sessionId,
  });

  const filteredMatches = matches.filter(
    (m) =>
      m.player1?.toLowerCase().includes(search.toLowerCase()) ||
      m.player2?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {t("results")}
          </h1>
          <p className="text-slate-500 text-sm">{t("resultsDesc")}</p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        {!activeTournamentId ? (
          <div className="text-center py-16 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No tournament selected. Go to Pair &amp; Group tab and select a tournament.</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">{t("loading")}</div>
        ) : (() => {
          const groupStandings = computeGroupStandings(filteredMatches);
          const groupIndices = [...new Set(filteredMatches.map((m) => m.group_index ?? 0))].sort((a, b) => a - b);
          return Object.keys(groupStandings).length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noResults")}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-slate-800 text-sm">{activeTournament?.name}</span>
                <span className="text-xs text-slate-400 ml-1">· {filteredMatches.filter(m => m.status === "completed").length} completed matches</span>
              </div>
              {groupIndices.map((gi) => {
                const st = groupStandings[gi];
                if (!st || st.length === 0) return null;
                return <GroupStandingsTable key={gi} groupIndex={gi} standings={st} t={t} />;
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}