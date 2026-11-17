import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { animationIndex, ticketTotal } from "../../lib/raffle";
import RaffleButton from "../RaffleButton/RaffleButton";
import Icon from "../Icon";

export default function Main() {
  const { state, dispatch, revealId, reducedMotion, setTab, presenting } =
    useContext(AppContext);
  const drawing = state.phase === "drawing";
  const winner = state.winners[state.winners.length - 1];
  const ready = state.participants.length > 0;
  const celebrating = !drawing && !reducedMotion && winner?.id === revealId;
  const currentName = drawing
    ? state.participants[
        animationIndex(state.draw.frame, state.participants.length)
      ]?.name
    : winner?.name;
  const weighted = state.participants.some((person) => person.tickets !== 1);
  const number = drawing
    ? state.nextDrawNumber
    : winner?.number || state.nextDrawNumber;
  const addNames = () => {
    setTab("entries");
    window.setTimeout(
      () => document.getElementById("participant-names")?.focus(),
      0,
    );
  };
  let caption;
  if (drawing)
    caption =
      state.participants.length === 1
        ? "One participant. Their moment is coming."
        : "One of these names is about to make the headline.";
  else if (winner)
    caption = ready
      ? "A little luck. A new name in the headlines."
      : "The last name is in. Add more names to keep the story going.";
  else if (ready)
    caption =
      state.participants.length === 1
        ? "Only one participant is eligible. This draw will announce their name."
        : "The names are in. Let luck write the next headline.";
  else
    caption =
      "Bring the names. We’ll bring the suspense. Add your participants to get the draw started.";

  return (
    <section
      id="draw-panel"
      tabIndex={-1}
      aria-label="Live draw"
      className={`draw-panel ${winner && !drawing ? "has-winner" : ""} ${celebrating ? "is-breaking" : ""}`}
    >
      <div className="stage-topline">
        <span className="story-category">
          {drawing ? "Drawing live" : winner ? "Winner announced" : "Live draw"}
        </span>
        <span>Draw {String(number).padStart(2, "0")}</span>
      </div>
      <div
        className={`stage-content ${drawing ? "is-drawing" : ""}`}
        aria-busy={drawing}
      >
        {drawing ? (
          <h2 className="lead-headline winner-name" aria-hidden="true">
            {currentName}
          </h2>
        ) : winner ? (
          <h2 className="lead-headline winner-headline">
            <span className="winner-name">{winner.name}</span>{" "}
            <span className="winner-verdict">wins Draw {winner.number}</span>
          </h2>
        ) : (
          <h2 className="lead-headline ready-headline">
            {ready
              ? "Who makes the next headline?"
              : "Your next winner starts here."}
          </h2>
        )}
        <p className="stage-caption">{caption}</p>
      </div>
      <div className="stage-bottom">
        {ready && (
          <p className="eligible-count">
            {state.participants.length.toLocaleString()}{" "}
            {state.participants.length === 1 ? "name" : "names"} in the draw
            {weighted
              ? ` · ${ticketTotal(state.participants).toLocaleString()} tickets`
              : ""}
          </p>
        )}
        <div className="draw-action">
          {ready || drawing ? (
            <RaffleButton />
          ) : winner && !presenting ? (
            <button className="button primary" onClick={addNames}>
              Add more names
              <Icon name="plus" />
            </button>
          ) : !winner && !presenting ? (
            <button className="text-button start-link" onClick={addNames}>
              Add names to begin
              <Icon name="arrow" />
            </button>
          ) : winner ? (
            <p className="stage-empty-hint">The draw is complete.</p>
          ) : null}
          {!drawing && state.undo && (
            <button
              className="text-button stage-undo"
              onClick={() => dispatch({ type: "UNDO" })}
            >
              <Icon name="undo" />
              Undo last draw
            </button>
          )}
        </div>
      </div>
      {celebrating && (
        <div className="confetti" aria-hidden="true" data-testid="confetti">
          {Array.from({ length: 32 }, (_, index) => (
            <i
              key={index}
              style={{
                "--x": `${(index * 37) % 100}%`,
                "--drift": `${((index * 71) % 240) - 120}px`,
                "--turn": `${index % 2 ? 420 : -360}deg`,
                "--delay": `${(index % 5) * 35}ms`,
                "--color": ["#ff5f1b", "#172038", "#a63308"][index % 3],
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
