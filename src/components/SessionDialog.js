import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { ticketTotal } from "../lib/raffle";
import Dialog from "./Dialog";
import Icon from "./Icon";

export function SaveDialog({ onClose }) {
  const { state, save } = useContext(AppContext);
  const [name, setName] = useState(state.sessionName),
    [copy, setCopy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog title="Keep this edition" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            setError("Give your session a name.");
            return;
          }
          if (save(name, copy)) onClose();
          else
            setError(
              "Could not save. Check that browser storage is available and has space.",
            );
        }}
      >
        <p className="dialog-description">
          Save the eligible pool, draw rules, and winner history on this device.
        </p>
        <label className="field-label">
          Session name
          <input
            data-autofocus
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Friday team raffle"
          />
        </label>
        {state.savedId && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={copy}
              onChange={(event) => setCopy(event.target.checked)}
            />
            <span>
              Save as a new session
              <small>Leave the previous version intact.</small>
            </span>
          </label>
        )}
        <p className="hint">
          {state.savedId && !copy ? "This updates your saved session. " : ""}
          Saving is manual. Refresh starts a fresh raffle; load this session to
          continue.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            <Icon name="save" />
            Save session
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export default function SessionDialog({ onClose }) {
  const { state, dispatch, sessions, rename, removeSession, setTab } =
    useContext(AppContext);
  const [action, setAction] = useState(null),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const load = (session) => {
    dispatch({ type: "LOAD", session });
    setTab(
      session.data.winners.length || session.data.participants.length
        ? "draw"
        : "entries",
    );
    onClose();
  };
  return (
    <Dialog
      title={
        action?.kind === "rename"
          ? "Rename this edition"
          : action?.kind === "delete"
            ? "Delete saved session?"
            : action?.kind === "load"
              ? "Replace the current raffle?"
              : "Saved editions"
      }
      onClose={onClose}
    >
      {!action ? (
        <>
          <p className="dialog-description">
            Saved on this device, ready when you are. Current changes are kept
            only when you press Save.
          </p>
          {sessions.length ? (
            <ul className="session-list">
              {[...sessions]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((session) => (
                  <li key={session.id}>
                    <h3>{session.name}</h3>
                    <p>
                      {session.data.participants.length} participants ·{" "}
                      {ticketTotal(session.data.participants).toLocaleString()}{" "}
                      tickets · {session.data.winners.length} winners
                    </p>
                    <time dateTime={session.updatedAt}>
                      Saved {new Date(session.updatedAt).toLocaleString()}
                    </time>
                    <div className="session-actions">
                      <button
                        className="button secondary"
                        onClick={() =>
                          state.dirty
                            ? setAction({ kind: "load", session })
                            : load(session)
                        }
                      >
                        Load
                        <Icon name="arrow" />
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          setName(session.name);
                          setAction({ kind: "rename", session });
                        }}
                      >
                        Rename
                        <span className="visually-hidden"> {session.name}</span>
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${session.name}`}
                        onClick={() => setAction({ kind: "delete", session })}
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="session-empty">
              <Icon name="folder" />
              <h3>No saved editions yet.</h3>
              <p>
                Close this window and choose Save session to keep your raffle.
              </p>
            </div>
          )}
        </>
      ) : action.kind === "rename" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Enter a session name.");
              return;
            }
            if (rename(action.session.id, name)) {
              setAction(null);
              setError("");
            } else
              setError(
                "Could not rename this session. Storage may be unavailable.",
              );
          }}
        >
          <label className="field-label">
            Session name
            <input
              data-autofocus
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setAction(null);
                setError("");
              }}
            >
              Back
            </button>
            <button className="button primary" type="submit">
              Save name
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="dialog-description">
            {action.kind === "load"
              ? `Your current raffle has unsaved changes. Loading “${action.session.name}” will replace them.`
              : `“${action.session.name}” will be removed from this device. Your current raffle will stay open.`}
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => {
                setAction(null);
                setError("");
              }}
            >
              Back
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (action.kind === "load") load(action.session);
                else if (removeSession(action.session.id)) setAction(null);
                else
                  setError("Could not delete. Browser storage is unavailable.");
              }}
            >
              {action.kind === "load" ? "Replace and load" : "Delete session"}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
