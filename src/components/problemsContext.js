import { createContext, useContext } from "react";

// Maps a form field name to the problem found with it at save time, so any
// field can show its own message without the problems being passed down
// through every section by hand.
export const ProblemsContext = createContext({});

export function useFieldProblem(field) {
  return useContext(ProblemsContext)[field] ?? null;
}
