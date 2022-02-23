import React, {useContext, useEffect, useRef, useState} from 'react';
import {AppContext} from '../context/AppContext';

function Sidebar(){
  const ref = useRef();
  const {entries, winners, setEntries, setWinners} = useContext(AppContext);
  
  const handleClick = () => {
    const elEntries = document.querySelectorAll('.entry');

    // Reset highlighted entries
    const prevWinner = document.querySelectorAll('.highlight');
    if(prevWinner){
      console.log(prevWinner)
      for(const el of prevWinner){
        el.classList.remove('highlight');
      }
    }

    // Get 1000 random integers for "random choosing" effect then animate for 5 seconds
    const rSize = 1000;
    const time = 5;
    let randomNumbers = new Array(rSize).fill(0).map((v) => Math.floor(Math.random() * entries.length));
    randomNumbers.forEach((num,i) => {
      
      setTimeout(() => {  
        if(i === rSize-1){
          elEntries[num].style.animation = 'highlight-win 0.33s 3';
          elEntries[num].addEventListener('animationend', (e) => {
            elEntries[num].style.removeProperty('animation');
          })
          elEntries[num].classList.add('highlight');

          setWinners([...winners, elEntries[num].textContent])

        }else{
          elEntries[num].style.animation = 'highlight-fade 1s 1';
          elEntries[num].addEventListener('animationend', (e) => {
            elEntries[num].style.removeProperty('animation');
          })
        }

      }, time*i)

    })
  }
  
  const handleInputChange = () => {
    setEntries(ref.current.value.split("\n").filter(s => s !== ''))
  }

  useEffect(() => {
    
  }, [entries])

  return(
    <div id="sidebar">
      <h1>Randomizer</h1>
      
      <div id="input-area">
        <h3>Entries <span id="count">({entries.length})</span></h3>
        <textarea name="entries" onChange={handleInputChange} ref={ref}></textarea>
        <button id="pick" onClick={handleClick}>Pick</button>
      </div>

      <div id="winners">
        <h3>Recent winners:</h3>
        <ul id="recent-winners">
          {
            winners.slice(0, winners.length).reverse().map(winner => {
              return(
                <li>{winner}</li>
              )
            })
          }
        </ul>
      </div>
    </div>
  )
}

export default Sidebar