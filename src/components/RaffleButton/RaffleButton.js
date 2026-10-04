import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Icon from "../Icon";
export default function RaffleButton() {
  const { state, draw } = useContext(AppContext);
  const drawing = state.phase === "drawing";
  return (
    <button
      className="button primary draw-button"
      disabled={drawing || !state.participants.length}
      onClick={draw}
    >
      <Icon name="ticket" />
      {drawing
        ? "Drawing the headline…"
        : state.winners.length
          ? "Draw the next winner"
          : "Draw a winner"}
      <Icon name="arrow" />
    </button>
  );
}
