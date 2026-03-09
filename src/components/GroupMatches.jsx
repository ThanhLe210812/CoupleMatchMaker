import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Swords, CheckCircle2, Save, ChevronDown, ChevronUp, User, SaveAll } from "lucide-react";
import { useLang } from "@/components/LangContext";

const groupColors = [
  { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-600", accent: "from-indigo-400 to-indigo-600" },
  { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-600", accent: "from-violet-400 to-violet-600" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-200", badge: "bg-fuchsia-600", accent: "from-fuchsia-400 to-fuchsia-600" },
  { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-600", accent: "from-rose-400 to-rose-600" },
  { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-600", accent: "from-amber-400 to-amber-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-600", accent: "from-emerald-400 to-emerald-600" },
  { bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-600", accent: "from-cyan-400 to-cyan-600" },
  { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-600", accent: "from-orange-400 to-orange-600" },
];

function generateRoundRobinMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ team1: teams[i], team2: teams[j] });
    }
  }
  return matches;
}

// team is either [p1, p2] (double) or [p] (single)
function teamLabel(team) {
  if (Array.isArray(team)) {
    if (team.length === 2) return `${team[0].name} & ${team[1].name}`;
    return team[0].name;
  }
  return team.name;
}

function MatchRow({ match, matchIndex, groupIndex, scores, onChange, onSave, savedStatus, color, gameMode }) {
  const { t } = useLang();
  const key = `${groupIndex}-${matchIndex}`;
  const s = scores[key] || { score1: "", score2: "" };
  const isSaved = savedStatus[key];

  const p1 = teamLabel(match.team1);
  const p2 = teamLabel(match.team2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: matchIndex * 0.04 }}
      className={`bg-white/80 rounded-xl border ${isSaved ? "border-green-200" : "border-slate-100"} p-3 space-y-2`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t("matchLabel")} {matchIndex + 1}</span>
        {isSaved && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t("savedLabel")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${color.accent} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {Array.isArray(match.team1) ? match.team1[0].name[0] : match.team1.name[0]}
          </div>
          <span className="text-sm font-medium text-slate-700 truncate">{p1}</span>
        </div>
        <Swords className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-slate-700 truncate text-right">{p2}</span>
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${color.accent} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {Array.isArray(match.team2) ? match.team2[0].name[0] : match.team2.name[0]}
          </div>
        </div>
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          type="number"
          min={0}
          placeholder={t("pts")}
          value={s.score1}
          onChange={(e) => onChange(key, "score1", e.target.value)}
          className="h-8 text-center text-sm rounded-lg flex-1"
        />
        <span className="text-slate-400 text-sm font-bold">:</span>
        <Input
          type="number"
          min={0}
          placeholder={t("pts")}
          value={s.score2}
          onChange={(e) => onChange(key, "score2", e.target.value)}
          className="h-8 text-center text-sm rounded-lg flex-1"
        />
        <Button
          size="sm"
          onClick={() => onSave(key, match, groupIndex, matchIndex, p1, p2)}
          disabled={s.score1 === "" || s.score2 === ""}
          className={`h-8 px-3 rounded-lg text-xs font-medium flex-shrink-0 ${
            isSaved
              ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          <Save className="w-3 h-3 mr-1" />
          {isSaved ? t("updateBtn") : t("saveBtn")}
        </Button>
      </div>
    </motion.div>
  );
}

export default function GroupMatches({ groups, soloParticipant, onSaveMatch, gameMode, sessionId, externalScores, externalSavedStatus, onScoreChange, onMarkSaved, externalCollapsed, onCollapseChange }) {
  const { t } = useLang();
  const [localCollapsed, setLocalCollapsed] = useState({});

  // Prefer external collapse state (persists tab-switch), fallback to local
  const collapsed = externalCollapsed ?? localCollapsed;
  const setCollapsed = (updater) => {
    const prev = externalCollapsed ?? localCollapsed;
    const next = typeof updater === "function" ? updater(prev) : updater;
    if (onCollapseChange) {
      Object.keys(next).forEach(k => { if (next[k] !== prev[k]) onCollapseChange(Number(k), next[k]); });
    } else {
      setLocalCollapsed(next);
    }
  };

  // Use external state if provided (so scores survive tab switches), else fallback to local
  const [localScores, setLocalScores] = useState({});
  const [localSavedStatus, setLocalSavedStatus] = useState({});
  const scores = externalScores ?? localScores;
  const savedStatus = externalSavedStatus ?? localSavedStatus;

  const handleChange = (key, field, value) => {
    if (onScoreChange) onScoreChange(key, field, value);
    else setLocalScores((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSave = (key, match, groupIndex, matchIndex, p1, p2) => {
    const s = scores[key] || {};
    onSaveMatch({
      key,
      groupIndex,
      round: matchIndex,
      player1: p1,
      player2: p2,
      score1: parseFloat(s.score1),
      score2: parseFloat(s.score2),
    });
    if (onMarkSaved) onMarkSaved(key);
    else setLocalSavedStatus((prev) => ({ ...prev, [key]: true }));
  };

  const handleSaveGroup = (gIndex, roundRobinMatches) => {
    roundRobinMatches.forEach((match, mIdx) => {
      const key = `${gIndex}-${mIdx}`;
      const s = scores[key];
      if (s && s.score1 !== "" && s.score2 !== "") {
        const p1 = teamLabel(match.team1);
        const p2 = teamLabel(match.team2);
        handleSave(key, match, gIndex, mIdx, p1, p2);
      }
    });
  };

  if (groups.length === 0) return null;

  const isDouble = gameMode === "double";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {groups.map((group, gIndex) => {
        const color = groupColors[gIndex % groupColors.length];
        const roundRobinMatches = generateRoundRobinMatches(group);
        const isCollapsed = collapsed[gIndex];
        const savedCount = roundRobinMatches.filter((_, mIdx) => savedStatus[`${gIndex}-${mIdx}`]).length;
        const unitLabel = isDouble ? t("couples") : t("teams");

        return (
          <motion.div
            key={gIndex}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: gIndex * 0.08 }}
            className={`${color.bg} ${color.border} border rounded-2xl overflow-hidden`}
          >
            <button
              onClick={() => {
                const next = !collapsed[gIndex];
                if (onCollapseChange) onCollapseChange(gIndex, next);
                else setLocalCollapsed(prev => ({ ...prev, [gIndex]: next }));
              }}
              className="w-full flex items-center justify-between p-4 hover:brightness-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`${color.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {t("group")} {gIndex + 1}
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{group.length}</span> {unitLabel} ·{" "}
                    <span className="font-semibold text-slate-800">{roundRobinMatches.length}</span> {t("matches")}
                  </p>
                  <p className="text-xs text-slate-400">{savedCount}/{roundRobinMatches.length} {t("saved")}</p>
                </div>
              </div>
              {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 space-y-3 overflow-hidden"
                >
                  {/* Teams/players in group */}
                  <div className="flex flex-wrap gap-2 pb-1">
                    {group.map((team, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700">
                        {isDouble ? (
                          <>
                            <span>{team[0].name}</span>
                            <span className="text-slate-400 font-bold">–</span>
                            <span>{team[1].name}</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{team[0].name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/60 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("matches")}</p>
                      {roundRobinMatches.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveGroup(gIndex, roundRobinMatches)}
                          className="h-7 px-3 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <SaveAll className="w-3 h-3 mr-1" />
                          Save Group
                        </Button>
                      )}
                    </div>
                    {roundRobinMatches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        {isDouble ? t("onlySingleCouple") : t("onlySinglePlayer")}
                      </p>
                    ) : (
                      roundRobinMatches.map((match, mIdx) => (
                        <MatchRow
                          key={mIdx}
                          match={match}
                          matchIndex={mIdx}
                          groupIndex={gIndex}
                          scores={scores}
                          onChange={handleChange}
                          onSave={handleSave}
                          savedStatus={savedStatus}
                          color={color}
                          gameMode={gameMode}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {soloParticipant && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{soloParticipant.name}</span> {t("unpairNote")}
          </p>
        </div>
      )}
    </motion.div>
  );
}