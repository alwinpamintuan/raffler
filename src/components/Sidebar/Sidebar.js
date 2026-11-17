import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../context/AppContext";
import {
  createId,
  previewImport,
  mergeParticipants,
  MAX_TICKETS,
  nameKey,
  ticketTotal,
  validateTickets,
} from "../../lib/raffle";
import Icon from "../Icon";
import { ConfirmDialog } from "../Dialog";
import ImportDialog from "../ImportDialog";
function ParticipantRow({
  participant,
  onUpdate,
  onRemove,
  disabled,
  showTickets,
}) {
  const [name, setName] = useState(participant.name),
    [tickets, setTickets] = useState(String(participant.tickets));
  useEffect(() => {
    setName(participant.name);
    setTickets(String(participant.tickets));
  }, [participant.name, participant.tickets]);
  const commitName = () => {
    if (name.trim() === participant.name) {
      setName(participant.name);
      return;
    }
    if (
      !onUpdate({
        ...participant,
        name: name.trim(),
      })
    )
      setName(participant.name);
  };
  const commitTickets = () => {
    try {
      const value = validateTickets(tickets);
      if (
        value !== participant.tickets &&
        !onUpdate({
          ...participant,
          tickets: value,
        })
      )
        setTickets(String(participant.tickets));
      else setTickets(String(value));
    } catch {
      onUpdate(
        null,
        `Tickets for ${participant.name} must be a whole number from 1 to ${MAX_TICKETS.toLocaleString()}.`,
      );
      setTickets(String(participant.tickets));
    }
  };
  return (
    <li className="participant-row">
      <input
        aria-label={`Name for ${participant.name}`}
        value={name}
        disabled={disabled}
        onChange={(event) => setName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      {showTickets && (
        <input
          type="number"
          min="1"
          max={MAX_TICKETS}
          step="1"
          aria-label={`Tickets for ${participant.name}`}
          value={tickets}
          disabled={disabled}
          onChange={(event) => setTickets(event.target.value)}
          onBlur={commitTickets}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      )}
      <button
        className="icon-button"
        disabled={disabled}
        aria-label={`Remove ${participant.name}`}
        onClick={() => onRemove(participant.id)}
      >
        <Icon name="close" />
      </button>
    </li>
  );
}
export default function Sidebar() {
  const { state, dispatch, tab, setTab } = useContext(AppContext);
  const [query, setQuery] = useState(""),
    [limit, setLimit] = useState(50),
    [modal, setModal] = useState(null),
    [text, setText] = useState(""),
    [mode, setMode] = useState("unique"),
    [showTickets, setShowTickets] = useState(false);
  const preview = useMemo(() => {
    try {
      const result = previewImport(text, "text", mode);
      const existingNames = new Set(
        state.participants.map((person) => nameKey(person.name)),
      );
      return {
        ...result,
        combined: mergeParticipants(
          state.participants,
          result.participants,
          mode,
        ),
        duplicates:
          result.duplicates +
          result.participants.filter((person) =>
            existingNames.has(nameKey(person.name)),
          ).length,
      };
    } catch (error) {
      return {
        error: error.message,
        participants: [],
      };
    }
  }, [text, mode, state.participants]);
  const addNames = (event) => {
    event.preventDefault();
    if (locked || preview.error || !preview.participants.length) return;
    dispatch({
      type: "PARTICIPANTS",
      participants: preview.combined,
    });
    setText("");
  };
  const locked = state.phase === "drawing";
  const filtered = state.participants.filter((item) =>
    nameKey(item.name).includes(nameKey(query)),
  );
  useEffect(() => setLimit(50), [query]);
  const update = (participant, message) => {
    if (!participant) {
      dispatch({
        type: "NOTICE",
        message,
      });
      return false;
    }
    if (!participant.name) {
      dispatch({
        type: "NOTICE",
        message: "Every participant needs a name.",
      });
      return false;
    }
    if (
      state.participants.some(
        (item) =>
          item.id !== participant.id &&
          nameKey(item.name) === nameKey(participant.name),
      )
    ) {
      dispatch({
        type: "NOTICE",
        message:
          "That name is already in the pool. Increase their tickets to add chances.",
      });
      return false;
    }
    const participants = state.participants.map((item) =>
      item.id === participant.id ? participant : item,
    );
    if (ticketTotal(participants) > MAX_TICKETS) {
      dispatch({
        type: "NOTICE",
        message: `The raffle limit is ${MAX_TICKETS.toLocaleString()} tickets.`,
      });
      return false;
    }
    dispatch({
      type: "PARTICIPANTS",
      participants,
    });
    return true;
  };
  return (
    <section
      id="entries-panel"
      tabIndex={-1}
      role="tabpanel"
      aria-labelledby="names-heading"
      className={`entries-panel ${tab === "entries" ? "mobile-active" : ""}`}
    >
      <h2 id="names-heading">Add names</h2>
      <form onSubmit={addNames}>
        <label className="field-label" htmlFor="participant-names">
          Names
        </label>
        <textarea
          id="participant-names"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          disabled={locked}
          placeholder={"Maria Santos\nJuan Cruz\nAna Reyes"}
          aria-describedby="names-hint names-preview"
        />
        <p className="hint" id="names-hint">
          One name per line.
        </p>
        <div id="names-preview" className="inline-preview" aria-live="polite">
          {text.trim() &&
            (preview.error ? (
              <p className="form-error" role="alert">
                {preview.error}
              </p>
            ) : (
              <p>
                {preview.participants.length.toLocaleString()}{" "}
                {preview.participants.length === 1 ? "name" : "names"} to add
                {preview.duplicates
                  ? ` · ${preview.duplicates} repeated ${preview.duplicates === 1 ? "name" : "names"} ${mode === "unique" ? "ignored" : "combined"}`
                  : ""}
              </p>
            ))}
        </div>
        <div className="entry-add-actions">
          <button
            className="button secondary"
            type="submit"
            disabled={
              locked || Boolean(preview.error) || !preview.participants.length
            }
          >
            <Icon name="plus" />
            Add names
          </button>
          <button
            className="text-button"
            type="button"
            disabled={locked}
            onClick={() => setModal("import")}
          >
            <Icon name="upload" />
            Import file
          </button>
        </div>
        <details className="entry-options">
          <summary>Entry options</summary>
          <fieldset className="simple-options" disabled={locked}>
            <legend className="visually-hidden">Repeated names</legend>
            <label className="checkbox-label">
              <input
                type="radio"
                name="inline-duplicates"
                checked={mode === "unique"}
                onChange={() => setMode("unique")}
              />
              <span>
                One ticket per name<small>Ignore repeated names.</small>
              </span>
            </label>
            <label className="checkbox-label">
              <input
                type="radio"
                name="inline-duplicates"
                checked={mode === "tickets"}
                onChange={() => setMode("tickets")}
              />
              <span>
                Combine repeats into tickets
                <small>Each repeat adds a chance.</small>
              </span>
            </label>
          </fieldset>
        </details>
      </form>
      {!state.participants.length && !state.winners.length && (
        <button
          className="text-button sample-button"
          disabled={locked}
          onClick={() =>
            dispatch({
              type: "PARTICIPANTS",
              participants: [
                "Maria Santos",
                "Juan Cruz",
                "Ana Reyes",
                "Paolo Garcia",
                "Bea Torres",
                "Miguel Ramos",
              ].map((name) => ({
                id: createId(),
                name,
                tickets: 1,
              })),
            })
          }
        >
          Try sample entries
          <Icon name="arrow" />
        </button>
      )}
      {state.participants.length > 0 && (
        <div className="entry-list">
          <div className="list-toolbar">
            <h3>Participants</h3>
            <button
              className="text-button"
              aria-pressed={showTickets}
              disabled={locked}
              onClick={() => setShowTickets(!showTickets)}
            >
              Edit tickets
            </button>
          </div>
          <div className="search-field">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Search participants"
              placeholder="Find a name"
              value={query}
              disabled={locked}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {showTickets && (
            <div className="participant-labels">
              <span>Name</span>
              <span>Tickets</span>
              <span />
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="list-empty">
              No names match “{query}”. Everyone is still eligible.
            </p>
          ) : (
            <ul
              className={`participant-list ${showTickets ? "editing-tickets" : ""}`}
            >
              {filtered.slice(0, limit).map((participant) => (
                <ParticipantRow
                  key={participant.id}
                  participant={participant}
                  disabled={locked}
                  showTickets={showTickets}
                  onUpdate={update}
                  onRemove={(id) =>
                    dispatch({
                      type: "PARTICIPANTS",
                      participants: state.participants.filter(
                        (item) => item.id !== id,
                      ),
                    })
                  }
                />
              ))}
            </ul>
          )}
          {filtered.length > limit && (
            <button
              className="text-button"
              onClick={() => setLimit(limit + 50)}
            >
              Show 50 more · {filtered.length.toLocaleString()} matching
            </button>
          )}
          <button
            className="text-button muted clear-entries"
            disabled={locked}
            onClick={() => setModal("clear")}
          >
            Clear names
          </button>
        </div>
      )}
      <details className="draw-settings">
        <summary>Draw options</summary>
        <label className="field-label" htmlFor="removal-policy">
          After a win
          <select
            id="removal-policy"
            value={state.settings.removal}
            disabled={locked}
            onChange={(event) =>
              dispatch({
                type: "SETTINGS",
                settings: {
                  removal: event.target.value,
                },
              })
            }
          >
            <option value="participant">
              Remove participant &amp; all tickets
            </option>
            <option value="ticket">Remove the winning ticket only</option>
            <option value="keep">Keep all tickets in the pool</option>
          </select>
        </label>
        <p className="hint">
          {state.settings.removal === "participant"
            ? "Each participant can win once."
            : state.settings.removal === "ticket"
              ? "Remaining tickets can win again."
              : "Repeat winners are possible."}
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.settings.instant}
            disabled={locked}
            onChange={(event) =>
              dispatch({
                type: "SETTINGS",
                settings: {
                  instant: event.target.checked,
                },
              })
            }
          />
          <span>
            Instant reveal<small>Skip the three-second suspense.</small>
          </span>
        </label>
      </details>
      {state.participants.length > 0 && (
        <button
          className="button primary mobile-draw-link"
          disabled={locked}
          onClick={() => setTab("draw")}
        >
          Go to draw
          <Icon name="arrow" />
        </button>
      )}
      {modal === "import" && <ImportDialog onClose={() => setModal(null)} />}
      {modal === "clear" && (
        <ConfirmDialog
          title="Clear all names?"
          message="This removes the eligible names and Undo. Winner history and saved sessions stay available."
          confirmLabel="Clear names"
          onConfirm={() =>
            dispatch({
              type: "PARTICIPANTS",
              participants: [],
            })
          }
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
