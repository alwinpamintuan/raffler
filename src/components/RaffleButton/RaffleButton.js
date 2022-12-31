import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import "./RaffleButton.css";

function RaffleButton() {
  const { entries, winners, setEntries, setWinners } = useContext(AppContext);

  const handleClick = () => {
    // No entries, focus on input
    if (entries.length === 0) {
      document.getElementById("entry-field").focus();
      return;
    }

    document.getElementById("main").scrollIntoView(true);

    // Disable button while "picking"
    const pickBtn = document.getElementById("pick");
    pickBtn.disabled = true;
    pickBtn.textContent = "Picking...";

    // Enable button after "picking" and remove animation of winning entry
    const endRaffleDraw = () => {
      pickBtn.disabled = false;
      pickBtn.textContent = "Pick";
    };

    // Reset highlighted entries
    const elEntries = document.querySelectorAll(".entry");
    const prevWinner = document.querySelectorAll(".highlight");
    if (prevWinner) {
      for (const el of prevWinner) {
        el.classList.remove("highlight");
      }
    }

    // Remove previous winner from entry if option is toggled
    const removeToggle = document.getElementById("remove-winners");
    if (removeToggle.checked && winners.length !== 0) {
      entries.splice(winners[winners.length - 1].idx, 1);
      setEntries([...entries]);

      // Remove from textarea
      const textareaElem = document.getElementById("entry-field");
      if (textareaElem) {
        const entryList = textareaElem.value.split(/\r?\n/);
        entryList.splice(winners[winners.length - 1].idx, 1);
        textareaElem.value = entryList.join("\r\n") + "\r\n";
      }
    }

    // Get 1000 random integers for "random choosing" effect then animate for 5 seconds
    const rSize = 1000;
    const time = 5;
    let randomNumbers = new Array(rSize)
      .fill(0)
      .map((v) => Math.floor(Math.random() * entries.length));
    randomNumbers.forEach((num, i) => {
      setTimeout(() => {
        if (i === rSize - 1) {
          elEntries[num].style.animation = "highlight-win 0.33s 3";
          elEntries[num].addEventListener("animationend", endRaffleDraw(num));

          elEntries[num].classList.add("highlight");
          setWinners([
            ...winners,
            {
              name: elEntries[num].textContent,
              idx: num,
            },
          ]);
        } else {
          elEntries[num].style.animation = "highlight-fade 1s 1";
          elEntries[num].addEventListener("animationend", () => {
            elEntries[num].style.removeProperty("animation");
          });
        }
      }, time * i);
    });
  };

  return (
    <button id="pick" onClick={handleClick}>
      DRAW
    </button>
  );
}

export default RaffleButton;
