import React, { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { animationIndex, ticketTotal } from "../../lib/raffle";
import Icon from "../Icon";

export default function RaffleDraw() {
  const { state, setTab } = useContext(AppContext);
  const [showAll, setShowAll] = useState(false);
  const total = ticketTotal(state.participants);
  return (
    <div className="pool-board">
      <div className="pool-heading">
        <h3 className="eyebrow">In the running</h3>
        <span>
          {state.participants.length.toLocaleString()}{" "}
          {state.participants.length === 1 ? "name" : "names"}
        </span>
      </div>
      {state.participants.length ? (
        <>
          <div className="pool-grid">
            {state.participants
              .slice(0, showAll ? 60 : 6)
              .map((participant, index) => (
                <div
                  className={`pool-card ${state.phase === "drawing" && animationIndex(state.draw.frame, state.participants.length) === index ? "pool-active" : ""}`}
                  key={participant.id}
                >
                  <span className="pool-initial" aria-hidden="true">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{participant.name}</strong>
                    <span>
                      {participant.tickets.toLocaleString()}{" "}
                      {participant.tickets === 1 ? "ticket" : "tickets"} ·{" "}
                      {((participant.tickets / total) * 100).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits:
                            participant.tickets / total < 0.01 ? 4 : 1,
                        },
                      )}
                      %
                    </span>
                  </div>
                </div>
              ))}
          </div>
          {state.participants.length > 6 && (
            <button
              className="text-button pool-more"
              onClick={() => {
                setShowAll(!showAll);
                setTab("draw");
              }}
            >
              {showAll
                ? "Show fewer names"
                : `See more participants (${state.participants.length.toLocaleString()})`}
            </button>
          )}
          {showAll && state.participants.length > 60 && (
            <p className="hint">
              Showing the first 60. Find every participant in the entry desk.
            </p>
          )}
        </>
      ) : (
        <p className="pool-empty">
          {state.winners.length ? (
            "Every ticket has had its moment. Add entries for another round."
          ) : (
            <>
              <Icon name="ticket" />
              The pool is empty. Your participants will appear here.
            </>
          )}
        </p>
      )}
    </div>
  );
}
