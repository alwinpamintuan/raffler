import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { animationIndex, ticketTotal } from "../../lib/raffle";
import Home from "../Home/Home";
import RaffleDraw from "../RaffleDraw/RaffleDraw";
import RaffleButton from "../RaffleButton/RaffleButton";
import Icon from "../Icon";

export default function Main() {
  const { state, dispatch, tab, presenting } = useContext(AppContext);
  const drawing = state.phase === "drawing",
    winner = state.winners[state.winners.length - 1];
  const currentName = drawing
    ? state.participants[
        animationIndex(state.draw.frame, state.participants.length)
      ]?.name
    : winner?.name;
  const ready = state.participants.length > 0;
  return (
    <section
      id="draw-panel"
      role="tabpanel"
      aria-labelledby="draw-heading"
      className={`draw-panel ${tab === "draw" ? "mobile-active" : ""}`}
    >
      <div className="section-heading">
        <span className="section-number">02</span>
        <h2 id="draw-heading">The live draw</h2>
        <span className={`status-tag ${drawing ? "is-drawing" : ""}`}>
          <span />
          {drawing
            ? "On air"
            : ready
              ? "Ready to draw"
              : winner
                ? "Round complete"
                : "Awaiting entries"}
        </span>
      </div>
      <div className={`draw-stage ${winner && !drawing ? "winner-stage" : ""}`}>
        <div className="stage-topline">
          <span className="eyebrow">
            {drawing
              ? "THE HEADLINE IS COMING"
              : winner
                ? "WINNER ANNOUNCED"
                : "EVERY TICKET TELLS A STORY"}
          </span>
          <span className="stage-issue">
            DRAW{" "}
            {String(
              drawing
                ? state.nextDrawNumber
                : winner?.number || state.nextDrawNumber,
            ).padStart(2, "0")}
          </span>
        </div>
        {!ready && !winner ? (
          <Home />
        ) : (
          <div className={`reveal-content ${drawing ? "drawing-content" : ""}`}>
            <span className="reveal-kicker">
              {drawing
                ? "A little suspense goes a long way."
                : winner
                  ? "And the headline belongs to…"
                  : "The pool is ready. The stage is yours."}
            </span>
            {currentName ? (
              <h2 className="winner-name" aria-hidden={drawing || undefined}>
                {currentName}
              </h2>
            ) : (
              <h2 className="ready-headline">
                Who will make
                <br />
                the headline?
              </h2>
            )}
            {drawing ? (
              <div className="draw-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min((state.draw.frame / 25) * 100, 100)}%`,
                  }}
                />
              </div>
            ) : winner ? (
              <>
                <span className="winner-stamp">
                  <Icon name="check" />
                  Officially the lucky one
                </span>
                <time dateTime={winner.drawnAt}>
                  {new Date(winner.drawnAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </>
            ) : (
              <p>
                {state.participants.length === 1
                  ? "One participant is eligible. This draw will announce their name."
                  : `${state.participants.length.toLocaleString()} participants. One winning moment.`}
              </p>
            )}
            {!ready && winner && (
              <p className="exhausted-note">
                That’s a wrap. The pool is empty.
              </p>
            )}
          </div>
        )}
        <div className="stage-stats">
          <div>
            <strong>{state.participants.length.toLocaleString()}</strong>
            <span>Participants</span>
          </div>
          <div>
            <strong>{ticketTotal(state.participants).toLocaleString()}</strong>
            <span>Eligible tickets</span>
          </div>
          <div>
            <strong>{state.winners.length.toLocaleString()}</strong>
            <span>Winners drawn</span>
          </div>
        </div>
      </div>
      <div className="draw-controls">
        <RaffleButton />
        <div className="draw-controls-meta">
          <span>
            <span className="secure-dot" />
            Equal chance per ticket
          </span>
          <button
            className="text-button"
            disabled={drawing || !state.undo}
            onClick={() => dispatch({ type: "UNDO" })}
          >
            <Icon name="undo" />
            Undo last draw
          </button>
        </div>
      </div>
      {!presenting && <RaffleDraw />}
    </section>
  );
}
