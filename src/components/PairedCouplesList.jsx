import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users2 } from "lucide-react";
import { useLang } from "@/components/LangContext";

const GROUP_COLORS = [
  { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
  { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  { bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-400" },
];

export default function PairedCouplesList({ pairedCouples }) {
  const { lang } = useLang();

  if (!pairedCouples || pairedCouples.length === 0) return null;

  // Group by groupIndex
  const byGroup = {};
  pairedCouples.forEach((c) => {
    if (!byGroup[c.groupIndex]) byGroup[c.groupIndex] = [];
    byGroup[c.groupIndex].push(c);
  });

  const groupIndices = Object.keys(byGroup).map(Number).sort((a, b) => a - b);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Users2 className="w-4 h-4 text-indigo-500" />
        <p className="text-sm font-semibold text-slate-700">
          {lang === "vi" ? "Các cặp đã ghép" : "Paired Players"}
        </p>
        <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
          {pairedCouples.length}
        </span>
      </div>

      {groupIndices.map((gIndex) => {
        const color = GROUP_COLORS[gIndex % GROUP_COLORS.length];
        const couples = byGroup[gIndex];
        const groupLabel = lang === "vi" ? `Bảng ${gIndex + 1}` : `Group ${gIndex + 1}`;

        return (
          <div key={gIndex} className={`rounded-2xl border ${color.border} ${color.bg} p-3`}>
            <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${color.badge}`}>
              {groupLabel}
            </p>
            <div className="space-y-1.5">
              <AnimatePresence>
                {couples.map((c, idx) => (
                  <motion.div
                    key={`${gIndex}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2"
                  >
                    <span className="text-indigo-700 text-xs font-semibold">{c.male?.name}</span>
                    <span className="text-slate-400 text-xs font-bold flex-shrink-0">–</span>
                    <span className="text-violet-700 text-xs font-semibold">{c.female?.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}