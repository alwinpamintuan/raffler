import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  chooseWinner,
  createId,
  initialState,
  raffleReducer,
  sessionData,
} from "../lib/raffle";
import { readSessions, writeSessions } from "../lib/sessions";

const AppContext = React.createContext(null);
function AppContextProvider({ children }) {
  const [state, dispatch] = useReducer(raffleReducer, undefined, initialState);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState("entries");
  const [presenting, setPresenting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    try {
      setSessions(readSessions());
    } catch {
      dispatch({
        type: "NOTICE",
        message:
          "Saved sessions are unavailable or damaged. You can still run a raffle; saving may replace damaged data.",
      });
    }
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(Boolean(query?.matches));
    update();
    query?.addEventListener?.("change", update);
    return () => query?.removeEventListener?.("change", update);
  }, []);
  useEffect(() => {
    if (state.phase !== "drawing") {
      busy.current = false;
      return;
    }
    const finish = () =>
      dispatch({
        type: "FINISH",
        id: createId(),
        drawnAt: new Date().toISOString(),
      });
    if (state.settings.instant || reducedMotion) {
      finish();
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started >= 3000) {
        window.clearInterval(timer);
        finish();
      } else
        dispatch({
          type: "FRAME",
          frame: Math.floor((Date.now() - started) / 120),
        });
    }, 120);
    return () => window.clearInterval(timer);
  }, [state.phase, state.settings.instant, reducedMotion]);
  const draw = useCallback(() => {
    if (busy.current || !state.participants.length) return;
    try {
      const winner = chooseWinner(state.participants);
      busy.current = true;
      setTab("draw");
      dispatch({ type: "START", winner });
    } catch (error) {
      dispatch({ type: "ERROR", message: error.message });
    }
  }, [state.participants]);
  const persist = (next) => {
    try {
      writeSessions(next);
      setSessions(next);
      return true;
    } catch {
      dispatch({
        type: "NOTICE",
        message:
          "Could not save on this device. Storage may be blocked or full. Your current raffle is still available.",
      });
      return false;
    }
  };
  const save = (name, copy = false) => {
    const id = !copy && state.savedId ? state.savedId : createId();
    const session = {
      id,
      name: name.trim(),
      updatedAt: new Date().toISOString(),
      data: sessionData(state),
    };
    if (!persist([...sessions.filter((item) => item.id !== id), session]))
      return false;
    dispatch({ type: "SAVED", id, name: session.name });
    return true;
  };
  const rename = (id, name) => {
    if (
      !persist(
        sessions.map((item) =>
          item.id === id ? { ...item, name: name.trim() } : item,
        ),
      )
    )
      return false;
    dispatch({ type: "RENAMED", id, name: name.trim() });
    return true;
  };
  const removeSession = (id) => {
    if (!persist(sessions.filter((item) => item.id !== id))) return false;
    dispatch({ type: "DELETED", id });
    return true;
  };
  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        draw,
        sessions,
        save,
        rename,
        removeSession,
        tab,
        setTab,
        presenting,
        setPresenting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export { AppContext, AppContextProvider };
