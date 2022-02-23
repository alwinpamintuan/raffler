import React, {useContext, useEffect, useRef} from 'react';
import {AppContext} from '../../context/AppContext';
import './Sidebar.css'

function Sidebar(){
  const ref = useRef();
  const {entries, winners, setEntries, setWinners} = useContext(AppContext);
  
  const introduction=
  `Welcome to Raffler!

Place entries separated by a new line in this section.

Example:
Entry 1
Entry 2
Entry 3
  `

  const handleClick = () => {
    window.location.href = '#raffle';
    const elEntries = document.querySelectorAll('.entry');

    // Reset highlighted entries
    const prevWinner = document.querySelectorAll('.highlight');
    if(prevWinner){
      console.log(prevWinner)
      for(const el of prevWinner){
        el.classList.remove('highlight');
      }
    }

    // Remove previous winner from entry if option is toggled
    const removeToggle = document.getElementById('remove-winners');
    if(removeToggle.checked){
      entries.splice(winners[winners.length-1].idx, 1);
      setEntries([...entries]);
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

          setWinners([...winners, {
            name: elEntries[num].textContent,
            idx: num
          }])

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
      <div id="header">
        <h1>RAFFLER</h1>
      </div>

      <div id="sidebar-content">
        <div id="input-area">
          <h3>Entries <span id="count">({entries.length})</span></h3>
          <textarea
            name="entries"
            onChange={handleInputChange}
            ref={ref}
            placeholder={introduction}>

          </textarea>
          <button id="pick" onClick={handleClick}>Pick</button>

          <div>
            <input type="checkbox" id="remove-winners" name="remove-winners"></input>
            <label for="remove-winners"> Remove entry of previous winners</label>
          </div>
        </div>

        <div id="winners">
          <h3>Recent winners:</h3>
          <ul id="recent-winners">
            {
              winners.slice(0, winners.length).reverse().map(winner => {
                return(
                  <li>{winner.name}</li>
                )
              })
            }
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Sidebar