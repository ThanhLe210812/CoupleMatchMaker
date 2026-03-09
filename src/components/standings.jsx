// Shared standings computation used by GroupMatches and Results
export function computeGroupStandings(matchList) {
  // matchList: array of { player1, player2, score1, score2, status, group_index }
  // Returns: map of group_index -> sorted standings array
  const groups = {};

  for (const m of matchList) {
    if (m.status !== "completed") continue;
    const gi = m.group_index ?? 0;
    if (!groups[gi]) groups[gi] = {};
    const stats = groups[gi];

    const getOrCreate = (name) => {
      if (!stats[name]) stats[name] = { mp: 0, w: 0, l: 0, d: 0, pts: 0, scored: 0, conceded: 0, h2h: {} };
      return stats[name];
    };

    const s1 = Number(m.score1 ?? 0);
    const s2 = Number(m.score2 ?? 0);
    const a = getOrCreate(m.player1);
    const b = getOrCreate(m.player2);
    a.mp++; b.mp++;
    a.scored += s1; a.conceded += s2;
    b.scored += s2; b.conceded += s1;

    if (!a.h2h[m.player2]) a.h2h[m.player2] = { w: 0, l: 0 };
    if (!b.h2h[m.player1]) b.h2h[m.player1] = { w: 0, l: 0 };

    if (s1 > s2) {
      a.w++; a.pts += 3; b.l++;
      a.h2h[m.player2].w++;
      b.h2h[m.player1].l++;
    } else if (s2 > s1) {
      b.w++; b.pts += 3; a.l++;
      b.h2h[m.player1].w++;
      a.h2h[m.player2].l++;
    } else {
      a.d++; b.d++;
      a.pts += 1; b.pts += 1;
    }
  }

  const result = {};
  for (const [gi, stats] of Object.entries(groups)) {
    const entries = Object.entries(stats).map(([name, s]) => ({ name, ...s, diff: s.scored - s.conceded }));
    entries.sort((x, y) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      const h2h_x = x.h2h[y.name]?.w ?? 0;
      const h2h_y = y.h2h[x.name]?.w ?? 0;
      if (h2h_x !== h2h_y) return h2h_y - h2h_x;
      if (y.diff !== x.diff) return y.diff - x.diff;
      return y.w - x.w;
    });
    result[Number(gi)] = entries;
  }
  return result;
}