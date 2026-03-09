import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/components/LangContext";

export default function ParticipantList({ participants, onRemove, onUpdatePairNumber }) {
  const { t } = useLang();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  const handleClick = (p) => {
    setEditingId(p.id);
    setEditValue(p.pair_number != null && p.pair_number !== "" ? String(p.pair_number) : "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = (p) => {
    const num = editValue !== "" ? Number(editValue) : null;
    if (onUpdatePairNumber) onUpdatePairNumber(p.id, num);
    setEditingId(null);
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t("noParticipants")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {participants.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
            onClick={() => editingId !== p.id && handleClick(p)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0 ${
                p.sex === "female"
                  ? "bg-gradient-to-br from-pink-400 to-rose-500"
                  : "bg-gradient-to-br from-blue-400 to-indigo-500"
              }`}>
                {p.sex === "female" ? "♀" : "♂"}
              </div>
              <span className="font-medium text-slate-700 truncate">{p.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${
                p.sex === "female"
                  ? "bg-pink-100 text-pink-600"
                  : "bg-blue-100 text-blue-600"
              }`}>
                {p.sex === "female" ? t("female") : t("male")}
              </span>
              {editingId === p.id && (
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Pair #</span>
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleBlur(p)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); } if (e.key === "Escape") { setEditingId(null); } }}
                    className="w-16 h-7 rounded-lg border border-amber-300 bg-amber-50 text-center text-sm font-semibold text-amber-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}