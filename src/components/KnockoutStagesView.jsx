import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import KnockoutBracket from "@/components/KnockoutBracket";

const STAGES = ["quarter_finals", "semi_finals", "final"];
const STAGE_LABELS = {
  quarter_finals: "Quarter-Finals",
  semi_finals: "Semi-Finals",
  final: "Final",
};

export default function KnockoutStagesView({ stage, knockoutBrackets, handleSaveKnockoutMatch, handleAdvanceStage, advanceButtonLabel }) {
  const [collapsed, setCollapsed] = useState({});

  // Show all stages that have matches, up to and including the current one
  const visibleStages = STAGES.filter((s) => {
    const matches = knockoutBrackets[s] || [];
    return matches.length > 0;
  });

  return (
    <div className="space-y-4 mt-2">
      {visibleStages.map((s) => {
        const isActive = s === stage;
        const isCollapsed = collapsed[s];
        const matches = knockoutBrackets[s] || [];
        return (
          <div key={s} className={`rounded-2xl border shadow-sm overflow-hidden ${isActive ? "border-amber-300 bg-amber-50/30" : "border-slate-200 bg-white"}`}>
            <button
              onClick={() => setCollapsed(prev => ({ ...prev, [s]: !prev[s] }))}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-black/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trophy className={`w-4 h-4 ${isActive ? "text-amber-500" : "text-slate-300"}`} />
                <span className={`text-sm font-bold ${isActive ? "text-amber-700" : "text-slate-500"}`}>{STAGE_LABELS[s]}</span>
                {isActive && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Active</span>}
              </div>
              {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-slate-100/80 pt-4">
                    <KnockoutBracket
                      stage={s}
                      matches={matches}
                      onSaveMatch={(data) => handleSaveKnockoutMatch(s, data)}
                    />
                    {isActive && stage !== "finished" && (
                      <div className="mt-4">
                        <Button
                          onClick={() => handleAdvanceStage(stage)}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          {advanceButtonLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}