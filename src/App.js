import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext, AppContextProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Main from "./components/Main/Main";
import Winners from "./components/Winners";
import SessionDialog, { SaveDialog } from "./components/SessionDialog";
import { ConfirmDialog } from "./components/Dialog";
import { Signature } from "./components/Signature/Signature";
import Icon from "./components/Icon";
import emblem from "./assets/raffler-mark.svg";
import "./App.css";
function Newsroom() {
  const {
    state,
    dispatch,
    tab,
    setTab,
    presenting,
    setPresenting,
    sessions,
    announcement,
  } = useContext(AppContext);
  const [activeSection, setActiveSection] = useState("draw-panel");
  const [modal, setModal] = useState(null),
    [fullscreen, setFullscreen] = useState(false);
  const presentRef = useRef(null),
    fullscreenRef = useRef(null),
    tabRefs = useRef({});
  const locked = state.phase === "drawing";
  useEffect(() => {
    const key = (event) => {
      if (event.key === "Escape" && !modal) {
        if (presenting) window.setTimeout(() => presentRef.current?.focus(), 0);
        setPresenting(false);
        if (document.fullscreenElement)
          document.exitFullscreen?.().catch(() => {});
      }
    };
    const change = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) {
        setPresenting(false);
        if (presenting) window.setTimeout(() => presentRef.current?.focus(), 0);
      }
    };
    document.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", change);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", change);
    };
  }, [setPresenting, modal, presenting]);
  useEffect(() => {
    if (presenting) fullscreenRef.current?.focus();
  }, [presenting]);
  useEffect(() => {
    if (state.phase === "drawing") setActiveSection("draw-panel");
    if (state.phase === "drawing")
      document.getElementById("draw-panel")?.scrollIntoView?.({
        block: "start",
      });
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
    ["entries", "Names"],
    ["draw", "Draw"],
  ];
  const navigateTo = (section) => {
    setActiveSection(section);
    setTab(section === "entries-panel" ? "entries" : "draw");
    window.setTimeout(() => {
      const target = document.getElementById(section);
      target?.focus();
      target?.scrollIntoView?.({ block: "start" });
    }, 0);
  };
  const openRaffleDialog = (event, kind) => {
    const menu = event.currentTarget.closest("details");
    menu.open = false;
    menu.querySelector("summary").focus();
    setModal(kind);
  };
  return (
    <div className={`app ${presenting ? "presentation" : ""}`}>
      <a href="#workspace" className="skip-link">
        Skip to raffle
      </a>
      <header className="app-header">
        <div className="masthead-start">
          {!presenting && (
            <details className="raffle-menu">
              <summary>Raffle</summary>
              <div className="raffle-menu-items">
                <button
                  disabled={locked}
                  onClick={(event) => openRaffleDialog(event, "sessions")}
                >
                  Saved sessions <span>{sessions.length}</span>
                </button>
                <button
                  disabled={locked}
                  onClick={(event) => openRaffleDialog(event, "new")}
                >
                  New raffle
                </button>
              </div>
            </details>
          )}
        </div>
        <a
          href={process.env.PUBLIC_URL + "/"}
          className="wordmark"
          aria-label="Raffler home"
        >
          <img src={emblem} alt="" width="44" height="44" />
          <span>RAFFLER</span>
        </a>
        <div className="toolbar">
          {!presenting && (
            <button
              className="button masthead-save"
              disabled={locked}
              onClick={() => setModal("save")}
            >
              <Icon name="save" />
              Save
            </button>
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
              className="button masthead-save"
              onClick={toggleFullscreen}
            >
              <Icon name="expand" />
              {fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}
        </div>
      </header>
      {!presenting && (
        <nav className="edition-nav" aria-label="Raffle navigation">
          <div className="edition-nav-inner">
            <a
              href="#draw-panel"
              aria-current={
                activeSection === "draw-panel" ? "location" : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                navigateTo("draw-panel");
              }}
            >
              Live draw
            </a>
            <a
              href="#entries-panel"
              aria-current={
                activeSection === "entries-panel" ? "location" : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                navigateTo("entries-panel");
              }}
            >
              Names
            </a>
            <a
              href="#winners-panel"
              aria-current={
                activeSection === "winners-panel" ? "location" : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                navigateTo("winners-panel");
              }}
            >
              Winners
            </a>
            <span>The raffle edition</span>
          </div>
        </nav>
      )}
      <main id="workspace" tabIndex={-1}>
        {!presenting && (
          <div className="session-info">
            <h1>{state.sessionName || "Untitled raffle"}</h1>
            <span>
              {state.dirty
                ? "Unsaved changes · Save before leaving"
                : state.savedId
                  ? "Saved on this device"
                  : "Save manually to keep your raffle"}
            </span>
          </div>
        )}
        {!presenting && (
          <nav
            className="mobile-tabs"
            role="tablist"
            aria-label="Raffle sections"
          >
            {tabs.map(([key, label], index) => (
              <button
                key={key}
                ref={(element) => {
                  tabRefs.current[key] = element;
                }}
                id={`${key}-tab`}
                role="tab"
                aria-controls={
                  key === "draw" ? "stage-workspace" : "entries-panel"
                }
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
                    selectTab(
                      tabs[
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 1
                            : (index + 1) % 2
                      ][0],
                      true,
                    );
                  }
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="newsroom-grid">
          <div
            id="stage-workspace"
            className={`stage-workspace ${tab === "draw" ? "mobile-active" : ""}`}
            role="tabpanel"
            aria-labelledby="draw-tab"
            aria-label="Draw and results"
          >
            <Main key={`${state.workspaceId}-draw`} />
            {!presenting && <Winners key={`${state.workspaceId}-winners`} />}
          </div>
          {!presenting && <Sidebar key={`${state.workspaceId}-entries`} />}
        </div>
      </main>
      <Signature />
      <div
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
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
              onClick={() =>
                dispatch({
                  type: "NOTICE",
                  message: "",
                })
              }
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
          title="Start a new raffle?"
          message="This clears the current entry pool, draw rules, and winner history. Unsaved changes will be lost. Your saved sessions stay available."
          confirmLabel="New raffle"
          onConfirm={() => {
            dispatch({
              type: "NEW",
            });
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
