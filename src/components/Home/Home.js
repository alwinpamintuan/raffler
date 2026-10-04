import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { createId } from "../../lib/raffle";
import Icon from "../Icon";

export default function Home() {
  const { dispatch } = useContext(AppContext);
  return (
    <div className="welcome-stage">
      <div className="ticket-art" aria-hidden="true">
        <div className="art-orbit" />
        <div className="art-ticket ticket-back">EVERY NAME HAS A CHANCE</div>
        <div className="art-ticket ticket-front">
          <span>RAFFLER / ADMIT ONE</span>
          <strong>
            YOUR
            <br />
            NEXT
            <br />
            WINNER.
          </strong>
          <div className="ticket-perforation" />
          <span className="ticket-serial">
            NO. 000001 <Icon name="ticket" />
          </span>
        </div>
        <span className="art-star">✳</span>
      </div>
      <h2>
        Your next winner
        <br />
        is waiting.
      </h2>
      <p>
        Bring the names. We’ll bring the suspense.
        <br />
        Add your participants to get the story started.
      </p>
      <button
        className="text-button sample-button"
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
            ].map((name) => ({ id: createId(), name, tickets: 1 })),
          })
        }
      >
        Try sample entries
        <Icon name="arrow" />
      </button>
    </div>
  );
}
