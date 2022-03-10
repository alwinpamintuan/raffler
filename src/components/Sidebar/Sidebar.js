import React, {useContext, useEffect, useRef} from 'react';
import {AppContext} from '../../context/AppContext';
import RaffleButton from '../RaffleButton/RaffleButton.js';
import './Sidebar.css';

function Sidebar(){
  const ref = useRef();
  const {entries, winners, setEntries} = useContext(AppContext);
  
  const introduction=
  `Welcome to Raffler!

Place entries separated by a new line in this section.

Example:
Entry 1
Entry 2
Entry 3
  `
  
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
            id="entry-field"
            name="entries"
            onChange={handleInputChange}
            ref={ref}
            placeholder={introduction}>
          </textarea>
          <RaffleButton/>

          <div>
            <input type="checkbox" id="remove-winners" name="remove-winners" defaultChecked></input>
            <label htmlFor="remove-winners"> Remove entry of previous winner</label>
          </div>
        </div>

        <div id="winners">
          <h3>Recent winners:</h3>
          <ul id="recent-winners">
            {
              winners.slice(0, winners.length).reverse().map((winner, idx) => {
                return(
                  <li key={idx}>{winner.name}</li>
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