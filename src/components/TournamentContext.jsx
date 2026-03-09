import React, { createContext, useContext, useState } from "react";

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const [activeTournamentId, setActiveTournamentId] = useState(null);

  return (
    <TournamentContext.Provider value={{ activeTournamentId, setActiveTournamentId }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}