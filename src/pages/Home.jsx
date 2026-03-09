import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shuffle, Users, Trash2, Sparkles, LayoutGrid, Rows3, User, Users2,
  Plus, Trophy, ChevronDown, ChevronUp, Flag, AlertTriangle, X, CheckSquare, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import AddUserForm from "@/components/AddUserForm";
import ParticipantList from "@/components/ParticipantList";
import GroupMatches from "@/components/GroupMatches";
import KnockoutBracket from "@/components/KnockoutBracket";
import KnockoutStagesView from "@/components/KnockoutStagesView";
import ShuffleMatchDialog from "@/components/ShuffleMatchDialog";
import PairedCouplesList from "@/components/PairedCouplesList";
import { useLang } from "@/components/LangContext";
import { computeGroupStandings } from "@/components/standings";

// ── helpers ──────────────────────────────────────────────────────────────────
function teamLabel(team) {
  if (!team) return "TBD";
  if (Array.isArray(team)) return team.length === 2 ? `${team[0].name} & ${team[1].name}` : team[0].name;
  return team.name;
}

function buildGroups(participants, gameMode, groupingMode, couplesPerGroup, totalGroups) {
  let teams = [];
  let solo = null;
  if (gameMode === "double") {
    // First: honor explicit pair_number assignments
    const forcedPairs = {};
    const unpaired = [];
    participants.forEach(p => {
      if (p.pair_number != null && p.pair_number !== "") {
        const key = String(p.pair_number);
        if (!forcedPairs[key]) forcedPairs[key] = [];
        forcedPairs[key].push(p);
      } else {
        unpaired.push(p);
      }
    });
    // Build teams from forced pairs (groups of same number)
    Object.values(forcedPairs).forEach(group => {
      for (let i = 0; i < group.length; i += 2) {
        if (i + 1 < group.length) teams.push([group[i], group[i + 1]]);
        else unpaired.push(group[i]); // odd one out goes to free pool
      }
    });
    // Pair remaining males with females randomly
    const males = unpaired.filter(p => p.sex === "male").sort(() => Math.random() - 0.5);
    const females = unpaired.filter(p => p.sex === "female").sort(() => Math.random() - 0.5);
    const minPairs = Math.min(males.length, females.length);
    for (let i = 0; i < minPairs; i++) teams.push([males[i], females[i]]);
    // Remaining unpaired participants
    const remaining = [...males.slice(minPairs), ...females.slice(minPairs)].sort(() => Math.random() - 0.5);
    for (let i = 0; i < remaining.length; i += 2) {
      if (i + 1 < remaining.length) teams.push([remaining[i], remaining[i + 1]]);
      else solo = remaining[i];
    }
  } else {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    teams = shuffled.map((p) => [p]);
  }
  let resultGroups = [];
  if (groupingMode === "couplesPerGroup") {
    const perGroup = Math.max(1, parseInt(couplesPerGroup) || 2);
    for (let i = 0; i < teams.length; i += perGroup) resultGroups.push(teams.slice(i, i + perGroup));
  } else {
    const numGroups = Math.min(Math.max(1, parseInt(totalGroups) || 2), teams.length);
    const base = Math.floor(teams.length / numGroups);
    const extra = teams.length % numGroups;
    let idx = 0;
    for (let g = 0; g < numGroups; g++) {
      const size = base + (g < extra ? 1 : 0);
      if (size > 0) resultGroups.push(teams.slice(idx, idx + size));
      idx += size;
    }
  }
  return { teams: resultGroups, solo };
}

// ── TournamentCard (for list) ─────────────────────────────────────────────────
function TournamentCard({ tournament, isActive, onSelect, onDelete, isDeleteMode, isSelected, onToggleSelect }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
      isActive ? "bg-indigo-50 border-indigo-300 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-200"
    }`}>
      {isDeleteMode && (
        <button onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="flex-shrink-0">
          {isSelected ? <CheckSquare className="w-4 h-4 text-red-500" /> : <Square className="w-4 h-4 text-slate-400" />}
        </button>
      )}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <p className="font-semibold text-slate-800 text-sm truncate">{tournament.name}</p>
        <p className="text-xs text-slate-400">{tournament.created_date ? format(new Date(tournament.created_date), "MMM d, yyyy") : ""} · {tournament.stage || "setup"}</p>
      </div>
      {isActive && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Active</span>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useLang();
  const queryClient = useQueryClient();

  // UI state
  const [showTournamentList, setShowTournamentList] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [showReshuffle, setShowReshuffle] = useState(false); // alert

  // Active tournament + its state
  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [gameMode, setGameMode] = useState("double");
  const [groupingMode, setGroupingMode] = useState("couplesPerGroup");
  const [couplesPerGroup, setCouplesPerGroup] = useState(2);
  const [totalGroups, setTotalGroups] = useState(2);
  const [groups, setGroups] = useState([]);
  const [soloParticipant, setSoloParticipant] = useState(null);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [stage, setStage] = useState("setup"); // setup | group_stage | quarter_finals | semi_finals | final | finished
  const [knockoutBrackets, setKnockoutBrackets] = useState({ quarter_finals: [], semi_finals: [], final: [] });
  const [savedMatchCount, setSavedMatchCount] = useState(0); // to detect if reshuffle warning needed
  // Score state lifted here so it persists between tab switches (backed by localStorage)
  const [groupScores, setGroupScoresRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("groupScores") || "{}"); } catch { return {}; }
  });
  const [groupSavedStatus, setGroupSavedStatusRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("groupSavedStatus") || "{}"); } catch { return {}; }
  });
  const [groupsCollapsed, setGroupsCollapsedRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("groupsCollapsed") || "false"); } catch { return false; }
  });
  const [groupCollapsedMap, setGroupCollapsedMapRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("groupCollapsedMap") || "{}"); } catch { return {}; }
  });

  // Wrappers that also persist to localStorage
  const setGroupScores = (v) => { const val = typeof v === "function" ? v(groupScores) : v; setGroupScoresRaw(val); try { localStorage.setItem("groupScores", JSON.stringify(val)); } catch {} };
  const setGroupSavedStatus = (v) => { const val = typeof v === "function" ? v(groupSavedStatus) : v; setGroupSavedStatusRaw(val); try { localStorage.setItem("groupSavedStatus", JSON.stringify(val)); } catch {} };
  const setGroupsCollapsed = (v) => { const val = typeof v === "function" ? v(groupsCollapsed) : v; setGroupsCollapsedRaw(val); try { localStorage.setItem("groupsCollapsed", JSON.stringify(val)); } catch {} };
  const setGroupCollapsedMap = (v) => { const val = typeof v === "function" ? v(groupCollapsedMap) : v; setGroupCollapsedMapRaw(val); try { localStorage.setItem("groupCollapsedMap", JSON.stringify(val)); } catch {} };

  // Step-by-step pairing state
  const [pairingQueue, setPairingQueue] = useState([]); // array of { male, female, groupIndex }
  const [pairingStep, setPairingStep] = useState(-1);   // current index being shown (-1 = not started)
  const [pairedCouples, setPairedCouples] = useState([]); // couples revealed so far
  const [showPairDialog, setShowPairDialog] = useState(false);
  const [pendingGroups, setPendingGroups] = useState(null); // groups to apply after all pairs revealed

  // Sync activeTournamentId to localStorage so Results tab can read it
  useEffect(() => {
    if (activeTournamentId) {
      try { localStorage.setItem("activeTournamentId", activeTournamentId); } catch {}
    }
  }, [activeTournamentId]);

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ["participants", activeTournamentId],
    queryFn: () => base44.entities.Participant.filter({ session_id: activeTournamentId }),
    enabled: !!activeTournamentId,
  });

  // Load active tournament state when it changes — only re-run when the active tournament ID changes
  const activeTournament = tournaments.find((t) => t.id === activeTournamentId);
  useEffect(() => {
    if (!activeTournamentId) return;
    const t = tournaments.find((x) => x.id === activeTournamentId);
    if (!t) return;
    setGameMode(t.game_mode || "double");
    setGroupingMode(t.grouping_mode || "couplesPerGroup");
    setCouplesPerGroup(t.couples_per_group || 2);
    setTotalGroups(t.total_groups || 2);
    setStage(t.stage || "setup");
    try { setGroups(t.groups ? JSON.parse(t.groups) : []); } catch { setGroups([]); }
    try { setSoloParticipant(t.solo_participant ? JSON.parse(t.solo_participant) : null); } catch { setSoloParticipant(null); }
    try { setKnockoutBrackets(t.knockout_brackets ? JSON.parse(t.knockout_brackets) : { quarter_finals: [], semi_finals: [], final: [] }); } catch { setKnockoutBrackets({ quarter_finals: [], semi_finals: [], final: [] }); }
    setSessionId(t.session_id || null);
    setHasShuffled(!!t.groups);
    // Reset score state only when switching tournaments
    setGroupScores({});
    setGroupSavedStatus({});
    setGroupsCollapsed(false);
    setGroupCollapsedMap({});
    setPairedCouples([]);
    setPairingQueue([]);
    setPairingStep(-1);
    setShowPairDialog(false);
    setPendingGroups(null);
  }, [activeTournamentId]); // ← only depends on ID, not on tournaments refetch

  const saveTournamentState = async (patch) => {
    if (!activeTournamentId) return;
    await base44.entities.Tournament.update(activeTournamentId, patch);
    queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  };

  // Mutations
  const createTournamentMutation = useMutation({
    mutationFn: (name) => base44.entities.Tournament.create({ name, stage: "setup" }),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setActiveTournamentId(t.id);
      setGroups([]); setHasShuffled(false); setStage("setup");
      setSessionId(null); setKnockoutBrackets({ quarter_finals: [], semi_finals: [], final: [] });
      setShowCreateForm(false); setNewTournamentName("");
      setShowTournamentList(false);
    },
  });

  const deleteTournamentsMutation = useMutation({
    mutationFn: async (ids) => { for (const id of ids) await base44.entities.Tournament.delete(id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setSelectedForDelete([]);
      setDeleteMode(false);
      if (selectedForDelete.includes(activeTournamentId)) {
        setActiveTournamentId(null); setGroups([]); setHasShuffled(false); setStage("setup");
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ name, sex, pair_number }) => base44.entities.Participant.create({ name, sex, session_id: activeTournamentId, ...(pair_number !== undefined ? { pair_number } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participants", activeTournamentId] }),
  });

  const updatePairNumberMutation = useMutation({
    mutationFn: ({ id, pair_number }) => base44.entities.Participant.update(id, { pair_number }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participants", activeTournamentId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Participant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", activeTournamentId] });
      setGroups([]); setHasShuffled(false);
      saveTournamentState({ groups: null, stage: "setup" });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => { for (const p of participants) await base44.entities.Participant.delete(p.id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", activeTournamentId] });
      setGroups([]); setSoloParticipant(null); setHasShuffled(false);
      saveTournamentState({ groups: null, solo_participant: null, stage: "setup" });
    },
  });

  const minRequired = gameMode === "double" ? 2 : 1;
  const totalTeams = gameMode === "double" ? Math.floor(participants.length / 2) : participants.length;

  const doShuffle = async () => {
    const { teams: resultGroups, solo } = buildGroups(participants, gameMode, groupingMode, couplesPerGroup, totalGroups);

    if (gameMode === "double") {
      // Build step-by-step pairing queue from groups
      const queue = [];
      resultGroups.forEach((group, gIndex) => {
        group.forEach((team) => {
          // Each team is [male, female] pair
          if (Array.isArray(team) && team.length === 2) {
            const male = team.find(p => p.sex === "male") || team[0];
            const female = team.find(p => p.sex === "female") || team[1];
            queue.push({ male, female, groupIndex: gIndex });
          }
        });
      });
      setPairingQueue(queue);
      setPairingStep(0);
      setPairedCouples([]);
      setShowPairDialog(queue.length > 0);
      setPendingGroups({ resultGroups, solo });
    } else {
      // Single mode: apply directly without dialog
      await applyGroups(resultGroups, solo);
    }
  };

  const applyGroups = async (resultGroups, solo) => {
    const sid = activeTournamentId || Date.now().toString();
    setGroups(resultGroups);
    setSoloParticipant(solo);
    setHasShuffled(true);
    setSessionId(sid);
    setStage("group_stage");
    setKnockoutBrackets({ quarter_finals: [], semi_finals: [], final: [] });
    setSavedMatchCount(0);
    setGroupScores({});
    setGroupSavedStatus({});
    setGroupsCollapsed(false);
    setGroupCollapsedMap({});
    setPairedCouples([]);
    await saveTournamentState({
      game_mode: gameMode,
      grouping_mode: groupingMode,
      couples_per_group: Number(couplesPerGroup),
      total_groups: Number(totalGroups),
      groups: JSON.stringify(resultGroups),
      solo_participant: JSON.stringify(solo),
      session_id: sid,
      stage: "group_stage",
      knockout_brackets: JSON.stringify({ quarter_finals: [], semi_finals: [], final: [] }),
    });
  };

  const handleNextPair = async () => {
    const currentPair = pairingQueue[pairingStep];
    // Add this pair to the revealed list
    setPairedCouples(prev => [...prev, currentPair]);

    const isLast = pairingStep >= pairingQueue.length - 1;
    if (isLast) {
      setShowPairDialog(false);
      setPairingStep(-1);
      // Now apply the groups to the actual tournament
      if (pendingGroups) {
        await applyGroups(pendingGroups.resultGroups, pendingGroups.solo);
        setPendingGroups(null);
      }
    } else {
      // Move to next pair — close & reopen dialog to trigger re-animation
      setShowPairDialog(false);
      setTimeout(() => {
        setPairingStep(prev => prev + 1);
        setShowPairDialog(true);
      }, 300);
    }
  };

  const handleShuffle = () => {
    if (hasShuffled && savedMatchCount > 0) {
      setShowReshuffle(true);
    } else {
      doShuffle();
    }
  };

  const handleSaveMatch = async ({ key, groupIndex, round, player1, player2, score1, score2 }) => {
    const sid = sessionId || activeTournamentId;
    const existing = await base44.entities.Match.filter({ session_id: sid, group_index: groupIndex, round });
    if (existing && existing.length > 0) {
      await base44.entities.Match.update(existing[0].id, { score1, score2, status: "completed" });
    } else {
      await base44.entities.Match.create({
        session_id: sid, group_index: groupIndex, round,
        player1, player2, score1, score2,
        game_mode: gameMode, status: "completed",
        tournament_id: activeTournamentId,
      });
    }
    setSavedMatchCount((c) => c + 1);
    queryClient.invalidateQueries({ queryKey: ["matches", activeTournamentId] });
  };

  // Finish Group Stage → save any unsaved scores, then compute standings → build Quarter-finals
  const handleFinishGroupStage = async () => {
    // Auto-save all scores that have been entered but not yet saved
    const sid = sessionId || activeTournamentId;
    const savePromises = [];
    groups.forEach((group, gIndex) => {
      const roundRobinMatches = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          roundRobinMatches.push({ team1: group[i], team2: group[j] });
        }
      }
      roundRobinMatches.forEach((match, mIdx) => {
        const key = `${gIndex}-${mIdx}`;
        const s = groupScores[key];
        if (s && s.score1 !== "" && s.score2 !== "" && !groupSavedStatus[key]) {
          const p1 = Array.isArray(match.team1) ? (match.team1.length === 2 ? `${match.team1[0].name} & ${match.team1[1].name}` : match.team1[0].name) : match.team1.name;
          const p2 = Array.isArray(match.team2) ? (match.team2.length === 2 ? `${match.team2[0].name} & ${match.team2[1].name}` : match.team2[0].name) : match.team2.name;
          savePromises.push(handleSaveMatch({ key, groupIndex: gIndex, round: mIdx, player1: p1, player2: p2, score1: parseFloat(s.score1), score2: parseFloat(s.score2) }));
          setGroupSavedStatus(prev => ({ ...prev, [key]: true }));
        }
      });
    });
    await Promise.all(savePromises);

    setGroupsCollapsed(true);
    const groupMatches = await base44.entities.Match.filter({ session_id: sid });
    const standings = computeGroupStandings(groupMatches);

    // Collect 1st and 2nd of each group
    const winners = []; // 1sts
    const runnersUp = []; // 2nds
    for (let gi = 0; gi < groups.length; gi++) {
      const st = standings[gi] || [];
      if (st[0]) winners.push(st[0].name);
      if (st[1]) runnersUp.push(st[1].name);
    }

    // Build QF pairs: W1 vs R2, W2 vs R1, W3 vs R4, W4 vs R3 ... etc
    const allAdvancing = [];
    for (let i = 0; i < Math.max(winners.length, runnersUp.length); i++) {
      if (winners[i]) allAdvancing.push({ name: winners[i], rank: 1 });
      if (runnersUp[i]) allAdvancing.push({ name: runnersUp[i], rank: 2 });
    }

    // Create QF matches: pair 1st of group A vs 2nd of group B alternating
    const qfMatches = [];
    for (let i = 0; i < winners.length; i++) {
      const w = winners[i];
      const r = runnersUp[(i + 1) % runnersUp.length] || runnersUp[i] || "TBD";
      qfMatches.push({ player1: w, player2: r, saved: false });
    }
    // If less than 8 matches, pad with TBD
    while (qfMatches.length < 8 && qfMatches.length < allAdvancing.length / 2) {
      qfMatches.push({ player1: "TBD", player2: "TBD", saved: false });
    }

    const newBrackets = { ...knockoutBrackets, quarter_finals: qfMatches };
    setKnockoutBrackets(newBrackets);
    setStage("quarter_finals");
    await saveTournamentState({ stage: "quarter_finals", knockout_brackets: JSON.stringify(newBrackets) });
  };

  const handleSaveKnockoutMatch = async (stageKey, { idx, player1, player2, score1, score2 }) => {
    const brackets = { ...knockoutBrackets };
    brackets[stageKey] = brackets[stageKey].map((m, i) =>
      i === idx ? { ...m, score1, score2, saved: true } : m
    );
    setKnockoutBrackets(brackets);
    await saveTournamentState({ knockout_brackets: JSON.stringify(brackets) });
  };

  const handleAdvanceStage = async (currentStage) => {
    const brackets = knockoutBrackets;
    let newStage = currentStage;
    let newMatches = [];

    if (currentStage === "quarter_finals") {
      newStage = "semi_finals";
      const qf = brackets.quarter_finals.filter((m) => m.saved);
      // winners of QF go to SF
      for (let i = 0; i < qf.length; i += 2) {
        const w1 = qf[i] ? (qf[i].score1 >= qf[i].score2 ? qf[i].player1 : qf[i].player2) : "TBD";
        const w2 = qf[i + 1] ? (qf[i + 1].score1 >= qf[i + 1].score2 ? qf[i + 1].player1 : qf[i + 1].player2) : "TBD";
        newMatches.push({ player1: w1, player2: w2, saved: false });
      }
    } else if (currentStage === "semi_finals") {
      newStage = "final";
      const sf = brackets.semi_finals.filter((m) => m.saved);
      for (let i = 0; i < sf.length; i += 2) {
        const w1 = sf[i] ? (sf[i].score1 >= sf[i].score2 ? sf[i].player1 : sf[i].player2) : "TBD";
        const w2 = sf[i + 1] ? (sf[i + 1].score1 >= sf[i + 1].score2 ? sf[i + 1].player1 : sf[i + 1].player2) : "TBD";
        newMatches.push({ player1: w1, player2: w2, saved: false });
      }
    } else if (currentStage === "final") {
      newStage = "finished";
    }

    if (newStage === "semi_finals") {
      const newBrackets = { ...brackets, semi_finals: newMatches };
      setKnockoutBrackets(newBrackets);
      setStage("semi_finals");
      await saveTournamentState({ stage: "semi_finals", knockout_brackets: JSON.stringify(newBrackets) });
    } else if (newStage === "final") {
      const newBrackets = { ...brackets, final: newMatches };
      setKnockoutBrackets(newBrackets);
      setStage("final");
      await saveTournamentState({ stage: "final", knockout_brackets: JSON.stringify(newBrackets) });
    } else if (newStage === "finished") {
      setStage("finished");
      await saveTournamentState({ stage: "finished" });
    }
  };

  const perGroupLabel = gameMode === "double" ? t("couplesPerGroup") : t("teamsPerGroup");

  const advanceButtonLabel = {
    quarter_finals: "Advance to Semi-Finals",
    semi_finals: "Advance to Final",
    final: "Finish Tournament",
  }[stage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">

        {/* Header + Tournament selector */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />{t("appTagline")}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{t("appName")}</h1>
        </motion.div>

        {/* Tournament Manager */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-800 text-sm">Tournament</span>
              {activeTournament && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {activeTournament.name}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost"
                onClick={() => { setShowTournamentList((v) => !v); setShowCreateForm(false); setDeleteMode(false); }}
                className="text-xs text-slate-500 hover:text-indigo-600 h-8">
                {showTournamentList ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                {tournaments.length} tournaments
              </Button>
              <Button size="sm"
                onClick={() => { setShowCreateForm((v) => !v); setShowTournamentList(false); }}
                className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> New
              </Button>
            </div>
          </div>

          {/* Create form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Tournament name..."
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && newTournamentName.trim() && createTournamentMutation.mutate(newTournamentName.trim())}
                    className="flex-1 h-9 rounded-xl"
                    autoFocus
                  />
                  <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={!newTournamentName.trim() || createTournamentMutation.isPending}
                    onClick={() => createTournamentMutation.mutate(newTournamentName.trim())}>
                    Create
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tournament list */}
          <AnimatePresence>
            {showTournamentList && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-3 space-y-2">
                  {tournaments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No tournaments yet. Create one!</p>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Select to switch</span>
                        <button onClick={() => { setDeleteMode((v) => !v); setSelectedForDelete([]); }}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${deleteMode ? "bg-red-50 text-red-600" : "text-slate-400 hover:text-red-500"}`}>
                          {deleteMode ? "Cancel" : "Delete"}
                        </button>
                      </div>
                      {tournaments.map((tour) => (
                        <TournamentCard
                          key={tour.id}
                          tournament={tour}
                          isActive={tour.id === activeTournamentId}
                          isDeleteMode={deleteMode}
                          isSelected={selectedForDelete.includes(tour.id)}
                          onToggleSelect={() => setSelectedForDelete((prev) =>
                            prev.includes(tour.id) ? prev.filter((x) => x !== tour.id) : [...prev, tour.id]
                          )}
                          onSelect={() => { setActiveTournamentId(tour.id); setShowTournamentList(false); }}
                        />
                      ))}
                      {deleteMode && selectedForDelete.length > 0 && (
                        <Button
                          onClick={() => deleteTournamentsMutation.mutate(selectedForDelete)}
                          disabled={deleteTournamentsMutation.isPending}
                          className="w-full h-9 bg-red-500 hover:bg-red-600 text-white text-xs mt-2">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete {selectedForDelete.length} tournament{selectedForDelete.length > 1 ? "s" : ""}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* No tournament selected */}
        {!activeTournamentId && (
          <div className="text-center py-16 text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Select or create a tournament to get started.</p>
          </div>
        )}

        {activeTournamentId && (
          <>
            {/* Game Mode */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6">
              <Label className="text-sm text-slate-600 mb-3 block font-medium">{t("gameMode")}</Label>
              <div className="flex gap-3">
                <button onClick={() => { setGameMode("double"); setGroups([]); setHasShuffled(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${gameMode === "double" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                  <Users2 className="w-4 h-4" />{t("double")}
                </button>
                <button onClick={() => { setGameMode("single"); setGroups([]); setHasShuffled(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${gameMode === "single" ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"}`}>
                  <User className="w-4 h-4" />{t("single")}
                </button>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h2 className="font-semibold text-slate-800">
                    {t("participants")}
                    {participants.length > 0 && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{participants.length}</span>
                    )}
                  </h2>
                </div>
                {participants.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => clearAllMutation.mutate()} disabled={clearAllMutation.isPending}
                    className="text-xs text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />{t("clearAll")}
                  </Button>
                )}
              </div>
              <AddUserForm onAdd={(name, sex, pair_number) => addMutation.mutate({ name, sex, pair_number })} isAdding={addMutation.isPending} />
              <div className="mt-5 max-h-64 overflow-y-auto">
                {participantsLoading ? (
                  <div className="text-center py-8 text-slate-400 text-sm">{t("loading")}</div>
                ) : (
                  <ParticipantList
                    participants={participants}
                    onRemove={(id) => removeMutation.mutate(id)}
                    onUpdatePairNumber={(id, pair_number) => updatePairNumberMutation.mutate({ id, pair_number })}
                  />
                )}
              </div>
            </div>

            {/* Shuffle Controls */}
            {participants.length >= minRequired && stage !== "finished" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-6 space-y-5">
                <div>
                  <Label className="text-sm text-slate-600 mb-2 block">{t("groupingMode")}</Label>
                  <div className="flex gap-2">
                    <button onClick={() => setGroupingMode("couplesPerGroup")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${groupingMode === "couplesPerGroup" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                      <Rows3 className="w-3.5 h-3.5" />{perGroupLabel}
                    </button>
                    <button onClick={() => setGroupingMode("totalGroups")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${groupingMode === "totalGroups" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                      <LayoutGrid className="w-3.5 h-3.5" />{t("totalGroups")}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    {groupingMode === "couplesPerGroup" ? (
                      <><Label className="text-sm text-slate-600 whitespace-nowrap">{perGroupLabel}:</Label>
                        <Input type="number" min={1} max={totalTeams} value={couplesPerGroup}
                          onChange={(e) => setCouplesPerGroup(e.target.value)} className="w-20 h-10 rounded-xl text-center" /></>
                    ) : (
                      <><Label className="text-sm text-slate-600 whitespace-nowrap">{t("numberOfGroups")}</Label>
                        <Input type="number" min={1} max={totalTeams} value={totalGroups}
                          onChange={(e) => setTotalGroups(e.target.value)} className="w-20 h-10 rounded-xl text-center" /></>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {totalTeams} {gameMode === "double" ? t("couples") : t("teams")} · {participants.length} {t("participants_count")}
                    {gameMode === "double" && participants.length % 2 !== 0 && ` · ${t("unpaired")}`}
                  </p>
                </div>
                {stage === "setup" || stage === "group_stage" ? (
                  <>
                    <Button onClick={handleShuffle}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-200">
                      <Shuffle className="w-4 h-4 mr-2" />
                      {hasShuffled ? t("reshuffle") : t("shuffle")}
                    </Button>
                    {pairedCouples.length > 0 && (
                      <PairedCouplesList pairedCouples={pairedCouples} />
                    )}
                  </>
                ) : null}
              </motion.div>
            )}

            {/* Step-by-step pair reveal dialog */}
            <ShuffleMatchDialog
              open={showPairDialog}
              pair={pairingQueue[pairingStep]}
              pairNumber={pairingStep + 1}
              totalPairs={pairingQueue.length}
              groupIndex={pairingQueue[pairingStep]?.groupIndex ?? 0}
              onNext={handleNextPair}
              isLast={pairingStep >= pairingQueue.length - 1}
            />

            {/* Reshuffle warning dialog */}
            <AnimatePresence>
              {showReshuffle && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                      <p className="font-semibold text-slate-800">Reshuffle?</p>
                    </div>
                    <p className="text-sm text-slate-600">You have {savedMatchCount} saved match score{savedMatchCount > 1 ? "s" : ""}. Reshuffling will create a new draw. Existing saved scores won't be deleted.</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowReshuffle(false)}>Cancel</Button>
                      <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => { setShowReshuffle(false); doShuffle(); }}>
                        <Shuffle className="w-4 h-4 mr-2" /> Reshuffle anyway
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Group Stage */}
            {hasShuffled && (stage === "group_stage" || (stage !== "setup" && groups.length > 0)) && (
              <div>
                <button
                  onClick={() => setGroupsCollapsed(v => !v)}
                  className="w-full flex items-center gap-2 mb-4"
                >
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    {t("groupsMatches")}
                    {groupsCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </button>
                <AnimatePresence>
                  {!groupsCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <GroupMatches
                        groups={groups}
                        soloParticipant={soloParticipant}
                        onSaveMatch={handleSaveMatch}
                        gameMode={gameMode}
                        sessionId={sessionId || activeTournamentId}
                        externalScores={groupScores}
                        externalSavedStatus={groupSavedStatus}
                        onScoreChange={(key, field, value) => setGroupScores(p => ({ ...p, [key]: { ...p[key], [field]: value } }))}
                        onMarkSaved={(key) => setGroupSavedStatus(p => ({ ...p, [key]: true }))}
                        externalCollapsed={groupCollapsedMap}
                        onCollapseChange={(gIndex, val) => setGroupCollapsedMap(p => ({ ...p, [gIndex]: val }))}
                      />
                      {stage === "group_stage" && (
                        <div className="mt-5">
                          <Button onClick={handleFinishGroupStage}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg">
                            <Flag className="w-4 h-4 mr-2" /> Finish Group Stage
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Knockout stages — each stage collapsible, all visible */}
            {(["quarter_finals", "semi_finals", "final", "finished"].includes(stage)) && (
              <KnockoutStagesView
                stage={stage}
                knockoutBrackets={knockoutBrackets}
                handleSaveKnockoutMatch={handleSaveKnockoutMatch}
                handleAdvanceStage={handleAdvanceStage}
                advanceButtonLabel={advanceButtonLabel}
              />
            )}

            {/* Finished */}
            {stage === "finished" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8 text-center mt-4">
                <Trophy className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <h2 className="text-xl font-extrabold text-slate-800 mb-1">Tournament Complete!</h2>
                {knockoutBrackets.final?.[0]?.saved && (
                  <p className="text-slate-600 text-sm">
                    🏆 Champion: <span className="font-bold">
                      {knockoutBrackets.final[0].score1 >= knockoutBrackets.final[0].score2
                        ? knockoutBrackets.final[0].player1
                        : knockoutBrackets.final[0].player2}
                    </span>
                  </p>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}