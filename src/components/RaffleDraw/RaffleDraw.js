import React, { useContext, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import "./RaffleDraw.css";

function RaffleDraw() {
  const { entries } = useContext(AppContext);

  // Show entries
  useEffect(() => {
    const container = document.getElementById("raffle");

    if (container) {
      const size = Math.floor(Math.sqrt(entries.length));
      container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      container.style.gridTemplateRows = `repeat(${size}, minmax(1fr, auto)`;
    }
  }, [entries]);

  return (
    <div id="raffle">
      {entries.map((entry, idx) => {
        return (
          <div className="entry" key={idx}>
            <h3>{entry}</h3>
          </div>
        );
      })}
    </div>
  );
}

export default RaffleDraw;
