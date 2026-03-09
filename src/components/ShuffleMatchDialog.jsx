import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, CheckCircle2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LangContext";
import confetti from "canvas-confetti";

// Fireworks effect using canvas-confetti
function launchFireworks() {
  const duration = 2200;
  const end = Date.now() + duration;
  const colors = ["#a855f7", "#6366f1", "#ec4899", "#f59e0b", "#10b981"];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Center burst
  confetti({
    particleCount: 80,
    spread: 120,
    origin: { x: 0.5, y: 0.6 },
    colors,
  });
}

export default function ShuffleMatchDialog({
  open,
  pair,           // { male, female, groupIndex } — the newly paired couple
  pairNumber,     // e.g. 3 (which pair this is out of total)
  totalPairs,
  groupIndex,
  onNext,         // called when user clicks "Next Pair" or "Finish"
  onClose,
  isLast,
}) {
  const { t, lang } = useLang();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open) {
      setRevealed(false);
      // Small delay then reveal + fireworks
      const timer = setTimeout(() => {
        setRevealed(true);
        launchFireworks();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open, pair]);

  if (!open || !pair) return null;

  const maleName = pair.male?.name || "?";
  const femaleName = pair.female?.name || "?";
  const groupLabel = lang === "vi" ? `Bảng ${groupIndex + 1}` : `Group ${groupIndex + 1}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-indigo-50 to-purple-50 opacity-60 pointer-events-none rounded-3xl" />

            {/* Pair counter */}
            <div className="relative z-10 mb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                {lang === "vi" ? `Cặp ${pairNumber} / ${totalPairs}` : `Pair ${pairNumber} / ${totalPairs}`}
              </span>
            </div>

            {/* Group badge */}
            <div className="relative z-10 mb-4">
              <span className="inline-block text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                {groupLabel}
              </span>
            </div>

            {/* Congrats text */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -10 }}
              transition={{ delay: 0.1 }}
              className="relative z-10 mb-5"
            >
              <p className="text-lg font-extrabold text-slate-800">
                {lang === "vi" ? "🎉 Đã ghép cặp!" : "🎉 New Pair!"}
              </p>
            </motion.div>

            {/* Names */}
            <div className="relative z-10 flex items-center justify-center gap-4 mb-6">
              {/* Male */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : -30 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shadow-md">
                  🏸
                </div>
                <p className="font-bold text-slate-800 text-sm mt-1">{maleName}</p>
              </motion.div>

              {/* VS separator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: revealed ? 1 : 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 10 }}
                className="flex flex-col items-center"
              >
                <span className="text-2xl font-extrabold text-slate-400">–</span>
              </motion.div>

              {/* Female */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : 30 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl shadow-md">
                  🏸
                </div>
                <p className="font-bold text-slate-800 text-sm mt-1">{femaleName}</p>
              </motion.div>
            </div>

            {/* Added to group */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: revealed ? 1 : 0 }}
              transition={{ delay: 0.7 }}
              className="relative z-10 text-xs text-slate-500 mb-6"
            >
              {lang === "vi"
                ? `✅ Đã thêm vào ${groupLabel}`
                : `✅ Added to ${groupLabel}`}
            </motion.p>

            {/* Action button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 10 }}
              transition={{ delay: 0.8 }}
              className="relative z-10"
            >
              <Button
                onClick={onNext}
                className={`w-full h-11 rounded-xl font-semibold text-white shadow-lg ${
                  isLast
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-indigo-200"
                }`}
              >
                {isLast ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />{lang === "vi" ? "Hoàn tất ghép đôi!" : "Finish Matching!"}</>
                ) : (
                  <><Shuffle className="w-4 h-4 mr-2" />{lang === "vi" ? "Ghép cặp tiếp theo →" : "Next Pair →"}</>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}