import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { resultsCSV, resultsText } from "../lib/raffle";
import { ConfirmDialog } from "./Dialog";
import Icon from "./Icon";

export default function Winners() {
  const { state, dispatch, tab } = useContext(AppContext);
  const [confirm, setConfirm] = useState(false),
    [limit, setLimit] = useState(50);
  const locked = state.phase === "drawing",
    empty = !state.winners.length;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultsText(state.winners));
      dispatch({
        type: "NOTICE",
        message: "Winner results copied to your clipboard.",
      });
    } catch {
      dispatch({
        type: "NOTICE",
        message:
          "Clipboard access is unavailable. Export the CSV to keep your results.",
      });
    }
  };
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([resultsCSV(state.winners)], {
          type: "text/csv;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "raffler-winners.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      dispatch({ type: "NOTICE", message: "Winner results exported as CSV." });
    } catch {
      dispatch({
        type: "NOTICE",
        message: "Could not export results. Try copying them instead.",
      });
    }
  };
  return (
    <section
      id="winners-panel"
      role="tabpanel"
      aria-labelledby="winners-tab"
      className={`winners-panel panel ${tab === "winners" ? "mobile-active" : ""}`}
    >
      <div className="section-heading">
        <span className="section-number">03</span>
        <h2>The winners</h2>
        <span className="count-badge">
          {state.winners.length.toLocaleString()}
        </span>
      </div>
      <p className="panel-intro">Good news travels. Keep the record here.</p>
      <div className="result-actions">
        <button
          className="button secondary"
          disabled={empty || locked}
          onClick={copy}
        >
          <Icon name="copy" />
          Copy
        </button>
        <button
          className="button secondary"
          disabled={empty || locked}
          onClick={download}
        >
          <Icon name="download" />
          Export CSV
        </button>
      </div>
      {empty ? (
        <div className="winners-empty">
          <div className="empty-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>No headlines. Yet.</h3>
          <p>
            The first winner will land here.
            <br />
            Stay tuned.
          </p>
        </div>
      ) : (
        <ol className="winner-list">
          {[...state.winners]
            .reverse()
            .slice(0, limit)
            .map((winner, index) => (
              <li
                key={winner.id}
                className={index === 0 ? "latest-winner" : ""}
              >
                <div className="winner-list-label">
                  <span>
                    {index === 0
                      ? "LATEST WINNER"
                      : `DRAW ${String(winner.number).padStart(2, "0")}`}
                  </span>
                  <span>#{String(winner.number).padStart(2, "0")}</span>
                </div>
                <h3>{winner.name}</h3>
                <time dateTime={winner.drawnAt}>
                  {new Date(winner.drawnAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
        </ol>
      )}
      {state.winners.length > limit && (
        <button className="text-button" onClick={() => setLimit(limit + 50)}>
          Show 50 more winners
        </button>
      )}
      <button
        className="text-button history-clear muted"
        disabled={empty || locked}
        onClick={() => setConfirm(true)}
      >
        <Icon name="trash" />
        Clear history
      </button>
      <div className="history-note">
        <span className="eyebrow">A NOTE FROM THE DESK</span>
        <p>A little luck. A lot of possibility.</p>
        <span>Save your session to keep the story after a refresh.</span>
      </div>
      {confirm && (
        <ConfirmDialog
          title="Clear winner history?"
          message="This clears the current results and Undo. Eligible tickets and saved sessions stay unchanged."
          confirmLabel="Clear history"
          onConfirm={() => dispatch({ type: "CLEAR_HISTORY" })}
          onClose={() => setConfirm(false)}
        />
      )}
    </section>
  );
}
