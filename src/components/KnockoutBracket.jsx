import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Swords, Save, CheckCircle2, Trophy } from "lucide-react";
import { useLang } from "@/components/LangContext";

export default function KnockoutBracket({ stage, matches, onSaveMatch }) {
  const { t } = useLang();
  const [scores, setScores] = useState({});
  const [savedStatus, setSavedStatus] = useState({});

  const stageLabel = {
    quarter_finals: "Quarter-Finals",
    semi_finals: "Semi-Finals",
    final: "Final",
  }[stage] || stage;

  const handleSave = (idx, m) => {
    const s = scores[idx] || {};
    const score1 = parseFloat(s.score1);
    const score2 = parseFloat(s.score2);
    onSaveMatch({ idx, player1: m.player1, player2: m.player2, score1, score2 });
    setSavedStatus((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{stageLabel}</span>
      </div>
      {matches.map((m, idx) => {
        const s = scores[idx] || { score1: "", score2: "" };
        const isSaved = savedStatus[idx] || m.saved;
        return (
          <div key={idx} className={`bg-white border ${isSaved ? "border-green-200" : "border-slate-200"} rounded-xl p-3 space-y-2`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Match {idx + 1}</span>
              {isSaved && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> Saved</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{m.player1 || "TBD"}</span>
              <Swords className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-slate-700 truncate text-right">{m.player2 || "TBD"}</span>
            </div>
            {m.player1 && m.player2 && (
              <div className="flex items-center gap-2">
                <Input type="number" min={0} placeholder="Score" value={isSaved && m.score1 !== undefined ? m.score1 : s.score1}
                  onChange={(e) => setScores(p => ({ ...p, [idx]: { ...p[idx], score1: e.target.value } }))}
                  className="h-8 text-center text-sm rounded-lg flex-1" disabled={isSaved} />
                <span className="text-slate-400 font-bold">:</span>
                <Input type="number" min={0} placeholder="Score" value={isSaved && m.score2 !== undefined ? m.score2 : s.score2}
                  onChange={(e) => setScores(p => ({ ...p, [idx]: { ...p[idx], score2: e.target.value } }))}
                  className="h-8 text-center text-sm rounded-lg flex-1" disabled={isSaved} />
                {!isSaved && (
                  <Button size="sm" disabled={s.score1 === "" || s.score2 === ""}
                    onClick={() => handleSave(idx, m)}
                    className="h-8 px-3 rounded-lg text-xs bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}