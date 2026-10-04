import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext, AppContextProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Main from "./components/Main/Main";
import Winners from "./components/Winners";
import SessionDialog, { SaveDialog } from "./components/SessionDialog";
import { ConfirmDialog } from "./components/Dialog";
import { Signature } from "./components/Signature/Signature";
import Icon from "./components/Icon";
import logo from "./assets/logowhite.png";
import "./App.css";

function Newsroom() {
  const { state, dispatch, tab, setTab, presenting, setPresenting, sessions } =
    useContext(AppContext);
  const [modal, setModal] = useState(null),
    [fullscreen, setFullscreen] = useState(false);
  const presentRef = useRef(null),
    fullscreenRef = useRef(null),
    tabRefs = useRef({});
  const locked = state.phase === "drawing";
  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape" && !modal) {
        setPresenting(false);
        if (document.fullscreenElement)
          document.exitFullscreen?.().catch(() => {});
      }
    };
    const change = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", change);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", change);
    };
  }, [setPresenting, modal]);
  useEffect(() => {
    if (presenting) fullscreenRef.current?.focus();
  }, [presenting]);
  useEffect(() => {
    if (state.phase === "drawing")
      document
        .getElementById("draw-panel")
        ?.scrollIntoView?.({ block: "start" });
  }, [state.phase]);
  const togglePresentation = () => {
    setPresenting(!presenting);
    setTab("draw");
    if (presenting) {
      if (document.fullscreenElement)
        document.exitFullscreen?.().catch(() => {});
      window.setTimeout(() => presentRef.current?.focus(), 0);
    }
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        dispatch({
          type: "NOTICE",
          message:
            "Fullscreen is unavailable in this browser. Presentation mode is still ready.",
        });
    } catch {
      dispatch({
        type: "NOTICE",
        message: "Fullscreen was blocked. Presentation mode is still ready.",
      });
    }
  };
  const selectTab = (key, focus = false) => {
    setTab(key);
    if (focus) tabRefs.current[key]?.focus();
  };
  const tabs = [
    ["entries", "Entries", state.participants.length],
    ["draw", "Draw", state.nextDrawNumber],
    ["winners", "Winners", state.winners.length],
  ];
  return (
    <div className={`app ${presenting ? "presentation" : ""}`}>
      <a href="#workspace" className="skip-link">
        Skip to raffle
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <a
            href={process.env.PUBLIC_URL + "/"}
            className="wordmark"
            aria-label="Raffler home"
          >
            RAFFLER<span>A LITTLE LUCK. A BIG HEADLINE.</span>
          </a>
          <img className="brand-mark" src={logo} alt="Raffler mark" />
          <div className="masthead-links">
            <a href="https://www.rappler.com/" target="_blank" rel="noreferrer">
              THE INSPIRATION
              <Icon name="arrow" />
            </a>
            <a
              href="https://github.com/alwinpamintuan/raffler"
              target="_blank"
              rel="noreferrer"
              className="github-link"
            >
              GITHUB
              <Icon name="arrow" />
            </a>
          </div>
        </div>
      </header>
      <div className="edition-bar">
        <span className="eyebrow">
          THE RAFFLE EDITION <span className="edition-separator">/</span>{" "}
          <span className="edition-subtitle">EVERYONE HAS A SHOT</span>
        </span>
        <span className="edition-label">An affectionate parody</span>
      </div>
      <main id="workspace" tabIndex={-1}>
        <div className="workspace-heading">
          <div>
            <span className="eyebrow orange">THE NEWSROOM OF CHANCE</span>
            <h1>
              {presenting
                ? "The stage is yours."
                : "Let luck make the headline."}
            </h1>
          </div>
          <div className="toolbar">
            {!presenting && (
              <>
                <button
                  className="button secondary"
                  disabled={locked}
                  onClick={() => setModal("sessions")}
                >
                  <Icon name="folder" />
                  <span>
                    Saved
                    <span className="toolbar-count">{sessions.length}</span>
                  </span>
                </button>
                <button
                  className="button secondary"
                  disabled={locked}
                  onClick={() => setModal("save")}
                >
                  <Icon name="save" />
                  Save session
                </button>
              </>
            )}
            <button
              ref={presentRef}
              className="button navy"
              onClick={togglePresentation}
            >
              <Icon name={presenting ? "close" : "screen"} />
              {presenting ? "Exit presentation" : "Present"}
            </button>
            {presenting && (
              <button
                ref={fullscreenRef}
                className="button secondary"
                onClick={toggleFullscreen}
              >
                <Icon name="expand" />
                {fullscreen ? "Exit fullscreen" : "Fullscreen"}
              </button>
            )}
          </div>
        </div>
        {!presenting && (
          <div className="session-bar">
            <span className="session-state">
              <span className={state.dirty ? "unsaved-dot" : "secure-dot"} />
              {state.sessionName || "Untitled raffle"}
              <span className="session-state-detail">
                {state.dirty
                  ? "Unsaved changes"
                  : state.savedId
                    ? "Saved on this device"
                    : "New session"}
              </span>
            </span>
            <div>
              <span className="save-hint">
                Save manually to keep progress after a refresh.
              </span>
              <button
                className="text-button"
                disabled={locked}
                onClick={() => setModal("new")}
              >
                <Icon name="plus" />
                New raffle
              </button>
            </div>
          </div>
        )}
        {!presenting && (
          <nav
            className="mobile-tabs"
            role="tablist"
            aria-label="Raffle sections"
          >
            {tabs.map(([key, label, count], index) => (
              <button
                key={key}
                ref={(element) => {
                  tabRefs.current[key] = element;
                }}
                id={`${key}-tab`}
                role="tab"
                aria-controls={`${key}-panel`}
                aria-selected={tab === key}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => selectTab(key)}
                onKeyDown={(event) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                    selectTab(tabs[next][0], true);
                  }
                }}
              >
                {label}
                <span>{count.toLocaleString()}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="newsroom-grid">
          {!presenting && <Sidebar key={`${state.workspaceId}-entries`} />}
          <Main key={`${state.workspaceId}-draw`} />
          {!presenting && <Winners key={`${state.workspaceId}-winners`} />}
        </div>
      </main>
      <Signature />
      <div
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.phase !== "drawing" && state.winners.length
          ? `Winner announced. Draw ${state.winners[state.winners.length - 1].number}: ${state.winners[state.winners.length - 1].name}.`
          : ""}
      </div>
      <div
        className="notice-wrap"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.notice && (
          <div className="notice">
            <Icon name="ticket" />
            <span>{state.notice}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              disabled={locked}
              onClick={() => dispatch({ type: "NOTICE", message: "" })}
            >
              <Icon name="close" />
            </button>
          </div>
        )}
      </div>
      {modal === "save" && <SaveDialog onClose={() => setModal(null)} />}
      {modal === "sessions" && <SessionDialog onClose={() => setModal(null)} />}
      {modal === "new" && (
        <ConfirmDialog
          title="Start a fresh edition?"
          message="This clears the current entry pool, draw rules, and winner history. Unsaved changes will be lost. Your saved sessions stay available."
          confirmLabel="New raffle"
          onConfirm={() => {
            dispatch({ type: "NEW" });
            setTab("entries");
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <AppContextProvider>
      <Newsroom />
    </AppContextProvider>
  );
}
