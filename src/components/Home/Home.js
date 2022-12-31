import React from "react";
import "./Home.css";

function Home() {
  return (
    <div id="home">
      <h3>WELCOME TO RAFFLER!</h3>
      <div>
        <h1>
          Raffler is a parody raffle application based on the visual aesthetic
          of&nbsp;
          <a href="https://www.rappler.com" target="_blank" rel="noreferrer">
            Rappler's
          </a>{" "}
          website.
        </h1>
        <p>
          If you are seeing this, then you have 0 entries!
          <br />
          To start raffling, input entries separated by a new line in the
          Entries section.
        </p>
      </div>
    </div>
  );
}

export default Home;
