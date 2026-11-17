import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { resultsCSV, resultsText } from "../lib/raffle";
import { ConfirmDialog } from "./Dialog";
import Icon from "./Icon";
export default function Winners() {
  const { state, dispatch } = useContext(AppContext);
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
      dispatch({
        type: "NOTICE",
        message: "Winner results exported as CSV.",
      });
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
      tabIndex={-1}
      aria-labelledby="winners-heading"
      className="winners-panel"
    >
      <div className="results-heading">
        <h2 id="winners-heading">
          Latest winners{!empty && <span>{state.winners.length}</span>}
        </h2>
        {!empty && (
          <div className="result-actions">
            <button className="text-button" disabled={locked} onClick={copy}>
              <Icon name="copy" />
              Copy
            </button>
            <button
              className="text-button"
              disabled={locked}
              onClick={download}
            >
              <Icon name="download" />
              Export CSV
            </button>
          </div>
        )}
      </div>
      {empty ? (
        <p className="winners-empty">Your winners will appear here.</p>
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
                <span className="result-number">
                  {String(winner.number).padStart(2, "0")}
                </span>
                <h3>
                  {winner.name} wins Draw {winner.number}
                </h3>
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
      {!empty && (
        <button
          className="text-button history-clear muted"
          disabled={locked}
          onClick={() => setConfirm(true)}
        >
          <Icon name="trash" />
          Clear history
        </button>
      )}
      {confirm && (
        <ConfirmDialog
          title="Clear winner history?"
          message="This clears the current results and Undo. Eligible tickets and saved sessions stay unchanged."
          confirmLabel="Clear history"
          onConfirm={() =>
            dispatch({
              type: "CLEAR_HISTORY",
            })
          }
          onClose={() => setConfirm(false)}
        />
      )}
    </section>
  );
}
