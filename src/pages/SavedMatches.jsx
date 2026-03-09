import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trash2, CheckCircle2, Clock, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function SavedMatches() {
  const [search, setSearch] = useState("");
  const [expandedSessions, setExpandedSessions] = useState({});
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
  });

  // Group by session
  const sessions = matches.reduce((acc, m) => {
    if (!acc[m.session_id]) acc[m.session_id] = [];
    acc[m.session_id].push(m);
    return acc;
  }, {});

  const filteredSessions = Object.entries(sessions).filter(([, ms]) =>
    ms.some(
      (m) =>
        m.player1?.toLowerCase().includes(search.toLowerCase()) ||
        m.player2?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggleSession = (sid) =>
    setExpandedSessions((prev) => ({ ...prev, [sid]: !prev[sid] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Saved Matches
          </h1>
          <p className="text-slate-500 text-sm">All recorded match results, grouped by session.</p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No saved matches yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSessions.map(([sessionId, sessionMatches]) => {
                const isOpen = expandedSessions[sessionId] !== false; // default open
                const completed = sessionMatches.filter((m) => m.status === "completed").length;
                const first = sessionMatches[0];

                return (
                  <motion.div
                    key={sessionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => toggleSession(sessionId)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">
                          Session — {first?.created_date ? format(new Date(first.created_date), "MMM d, yyyy · HH:mm") : sessionId}
                        </p>
                        <p className="text-xs text-slate-400">
                          {sessionMatches.length} match{sessionMatches.length !== 1 ? "es" : ""} · {completed} completed
                        </p>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                            {sessionMatches
                              .sort((a, b) => a.group_index - b.group_index || a.round - b.round)
                              .map((match) => (
                                <div
                                  key={match.id}
                                  className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">
                                      G{match.group_index + 1}
                                    </span>
                                    <span className="text-sm text-slate-700 truncate">{match.player1}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {match.status === "completed" ? (
                                      <span className="font-bold text-slate-800 text-sm tabular-nums">
                                        {match.score1} : {match.score2}
                                      </span>
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                                    )}
                                    <Swords className="w-3 h-3 text-slate-300 mx-1" />
                                  </div>

                                  <div className="flex items-center gap-1.5 min-w-0 justify-end">
                                    <span className="text-sm text-slate-700 truncate">{match.player2}</span>
                                    {match.status === "completed" && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMutation.mutate(match.id)}
                                    className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}