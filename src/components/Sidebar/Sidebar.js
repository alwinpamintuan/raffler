import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import {
  createId,
  MAX_TICKETS,
  nameKey,
  ticketTotal,
  validateTickets,
} from "../../lib/raffle";
import Icon from "../Icon";
import Dialog, { ConfirmDialog } from "../Dialog";
import ImportDialog from "../ImportDialog";

function ParticipantRow({ participant, onUpdate, onRemove, disabled }) {
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
    if (!onUpdate({ ...participant, name: name.trim() }))
      setName(participant.name);
  };
  const commitTickets = () => {
    try {
      const value = validateTickets(tickets);
      if (
        value !== participant.tickets &&
        !onUpdate({ ...participant, tickets: value })
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
    [newName, setNewName] = useState(""),
    [newTickets, setNewTickets] = useState("1"),
    [error, setError] = useState("");
  const locked = state.phase === "drawing";
  const filtered = state.participants.filter((item) =>
    nameKey(item.name).includes(nameKey(query)),
  );
  useEffect(() => setLimit(50), [query]);
  const update = (participant, message) => {
    if (!participant) {
      dispatch({ type: "NOTICE", message });
      return false;
    }
    if (!participant.name) {
      dispatch({ type: "NOTICE", message: "Every participant needs a name." });
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
    dispatch({ type: "PARTICIPANTS", participants });
    return true;
  };
  const add = (event) => {
    event.preventDefault();
    setError("");
    const name = newName.trim();
    if (!name) {
      setError("Enter a participant name.");
      return;
    }
    if (
      state.participants.some((item) => nameKey(item.name) === nameKey(name))
    ) {
      setError(
        "That name is already listed. Edit their ticket count to add chances.",
      );
      return;
    }
    try {
      const tickets = validateTickets(newTickets);
      if (ticketTotal(state.participants) + tickets > MAX_TICKETS)
        throw new Error(
          `The raffle limit is ${MAX_TICKETS.toLocaleString()} tickets.`,
        );
      dispatch({
        type: "PARTICIPANTS",
        participants: [
          ...state.participants,
          { id: createId(), name, tickets },
        ],
      });
      setModal(null);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <section
      id="entries-panel"
      role="tabpanel"
      aria-labelledby="entries-tab"
      className={`entries-panel panel ${tab === "entries" ? "mobile-active" : ""}`}
    >
      <div className="section-heading">
        <span className="section-number">01</span>
        <h2>The entry desk</h2>
        <span className="count-badge">
          {state.participants.length.toLocaleString()}
        </span>
      </div>
      <p className="panel-intro">
        A name. A ticket. A chance to make the headline.
      </p>
      <button
        className="button secondary full-width"
        disabled={locked}
        onClick={() => setModal("import")}
      >
        <Icon name="upload" />
        Paste or import entries
      </button>
      <div className="entry-summary">
        <strong>
          {ticketTotal(state.participants).toLocaleString()}{" "}
          <span>tickets in the pool</span>
        </strong>
        <Icon name="ticket" />
      </div>
      <p className="hint">
        More tickets = more chances. Edit a count to give someone extra entries.
      </p>
      <div className="search-field">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Search participants"
          placeholder="Find a participant"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="participant-labels">
        <span>Participant</span>
        <span>Tickets</span>
        <span />
      </div>
      {state.participants.length === 0 ? (
        <div className="entries-empty">
          <span className="empty-number">0</span>
          <p>The guest list is open.</p>
          <small>Add a name or bring your whole list.</small>
        </div>
      ) : filtered.length === 0 ? (
        <p className="list-empty">
          No names match “{query}”. Everyone is still eligible.
        </p>
      ) : (
        <ul className="participant-list">
          {filtered.slice(0, limit).map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              disabled={locked}
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
          className="text-button full-width"
          onClick={() => setLimit(limit + 50)}
        >
          Show 50 more · {filtered.length.toLocaleString()} matching
        </button>
      )}
      <div className="entry-list-actions">
        <button
          className="text-button"
          disabled={locked}
          onClick={() => {
            setNewName("");
            setNewTickets("1");
            setError("");
            setModal("add");
          }}
        >
          <Icon name="plus" />
          Add participant
        </button>
        <button
          className="text-button muted"
          disabled={locked || !state.participants.length}
          onClick={() => setModal("clear")}
        >
          Clear
        </button>
      </div>
      <div className="draw-settings">
        <h3 className="eyebrow">Draw rules</h3>
        <label className="field-label" htmlFor="removal-policy">
          After a win
          <select
            id="removal-policy"
            value={state.settings.removal}
            disabled={locked}
            onChange={(event) =>
              dispatch({
                type: "SETTINGS",
                settings: { removal: event.target.value },
              })
            }
          >
            <option value="participant">
              Remove participant & all tickets
            </option>
            <option value="ticket">Remove the winning ticket only</option>
            <option value="keep">Keep all tickets in the pool</option>
          </select>
        </label>
        <p className="hint">
          {state.settings.removal === "participant"
            ? "Everyone can win once."
            : state.settings.removal === "ticket"
              ? "Remaining tickets can win again."
              : "Every draw uses the same pool; repeats can win."}
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.settings.instant}
            disabled={locked}
            onChange={(event) =>
              dispatch({
                type: "SETTINGS",
                settings: { instant: event.target.checked },
              })
            }
          />
          <span>
            Instant reveal<small>Skip the three-second suspense.</small>
          </span>
        </label>
      </div>
      <button
        className="button primary mobile-draw-link"
        disabled={!state.participants.length || locked}
        onClick={() => setTab("draw")}
      >
        Ready? Go to the draw
        <Icon name="arrow" />
      </button>
      {modal === "import" && <ImportDialog onClose={() => setModal(null)} />}
      {modal === "clear" && (
        <ConfirmDialog
          title="Clear the entry desk?"
          message="This removes all eligible participants and invalidates Undo. Winner history and saved sessions stay available."
          confirmLabel="Clear entries"
          onClose={() => setModal(null)}
          onConfirm={() => dispatch({ type: "PARTICIPANTS", participants: [] })}
        />
      )}
      {modal === "add" && (
        <Dialog title="One more chance" onClose={() => setModal(null)}>
          <form onSubmit={add}>
            <label className="field-label">
              Participant name
              <input
                data-autofocus
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Maria Santos"
              />
            </label>
            <label className="field-label">
              Tickets
              <input
                type="number"
                min="1"
                max={MAX_TICKETS}
                step="1"
                value={newTickets}
                onChange={(event) => setNewTickets(event.target.value)}
              />
            </label>
            <p className="hint">
              Each ticket is an equal chance of being drawn.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className="button primary" type="submit">
                Add participant
                <Icon name="plus" />
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
