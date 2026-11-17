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
  const [revealId, setRevealId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const busy = useRef(false);
  useEffect(() => {
    setRevealId(null);
    setAnnouncement("");
  }, [state.workspaceId]);
  useEffect(() => {
    if (!revealId) return;
    const timer = window.setTimeout(() => setRevealId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [revealId]);
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
    const finish = () => {
      const id = createId();
      if (!state.settings.instant && !reducedMotion) setRevealId(id);
      setAnnouncement(
        `Winner announced. Draw ${state.nextDrawNumber}: ${state.draw.winner.name}.`,
      );
      dispatch({
        type: "FINISH",
        id,
        drawnAt: new Date().toISOString(),
      });
    };
    if (state.settings.instant || reducedMotion) {
      finish();
      return;
    }
    // A single deadline-based timer: quick cycling, deceleration, then a held beat.
    const beats = [
      80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 900, 1000, 1120, 1260,
      1420, 1610, 1830, 2080, 2350, 2600, 3000,
    ];
    const started = Date.now();
    let timer;
    const tick = (index) => {
      if (Date.now() - started >= 3000 || index === beats.length - 1) {
        finish();
        return;
      }
      dispatch({
        type: "FRAME",
        frame: index + 1,
      });
      timer = window.setTimeout(
        () => tick(index + 1),
        Math.max(0, beats[index + 1] - (Date.now() - started)),
      );
    };
    timer = window.setTimeout(() => tick(0), beats[0]);
    return () => window.clearTimeout(timer);
    // Draw metadata is captured at START; FRAME must not restart this sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.settings.instant, reducedMotion]);
  const draw = useCallback(() => {
    if (busy.current || !state.participants.length) return;
    try {
      const winner = chooseWinner(state.participants);
      busy.current = true;
      setRevealId(null);
      setAnnouncement("");
      setTab("draw");
      dispatch({
        type: "START",
        winner,
      });
    } catch (error) {
      dispatch({
        type: "ERROR",
        message: error.message,
      });
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
    dispatch({
      type: "SAVED",
      id,
      name: session.name,
    });
    return true;
  };
  const rename = (id, name) => {
    if (
      !persist(
        sessions.map((item) =>
          item.id === id
            ? {
                ...item,
                name: name.trim(),
              }
            : item,
        ),
      )
    )
      return false;
    dispatch({
      type: "RENAMED",
      id,
      name: name.trim(),
    });
    return true;
  };
  const removeSession = (id) => {
    if (!persist(sessions.filter((item) => item.id !== id))) return false;
    dispatch({
      type: "DELETED",
      id,
    });
    return true;
  };
  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        revealId,
        reducedMotion,
        announcement,
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
