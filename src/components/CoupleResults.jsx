import React from "react";
import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";

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

export default function CoupleResults({ groups, soloParticipant }) {
  if (groups.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, gIndex) => {
          const color = groupColors[gIndex % groupColors.length];
          return (
            <motion.div
              key={gIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: gIndex * 0.1 }}
              className={`${color.bg} ${color.border} border rounded-2xl p-5 relative overflow-hidden`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`${color.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  Group {gIndex + 1}
                </div>
                <span className="text-xs text-slate-500">
                  {group.length} {group.length === 1 ? "couple" : "couples"}
                </span>
              </div>

              <div className="space-y-3">
                {group.map((couple, cIndex) => (
                  <motion.div
                    key={cIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gIndex * 0.1 + cIndex * 0.05 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.accent} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {couple[0].name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700 text-sm">{couple[0].name}</span>
                    <Heart className="w-3.5 h-3.5 text-rose-400 mx-1 flex-shrink-0" />
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.accent} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {couple[1].name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700 text-sm">{couple[1].name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {soloParticipant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center"
        >
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{soloParticipant.name}</span> is unpaired (odd number of participants)
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}