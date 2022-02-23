import React, {useContext, useEffect} from 'react';
import {AppContext} from '../../context/AppContext'
import './EntriesContainer.css'

function EntriesContainer(){
  const {entries} = useContext(AppContext);

  useEffect(() => {
    const container = document.getElementById('raffle');

    if(container){
      const size = Math.floor(Math.sqrt(entries.length))
      container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      container.style.gridTemplateRows = `repeat(${size}, minmax(1fr, auto)`;
    }
    
  }, [entries])

  return(
    <div id="raffle">
      {
        entries.map((entry, id) => {
          return (
            <div className="entry" key={id}>
              {entry}
            </div>
          )
        })
      }
    </div>
  )
}

export default EntriesContainer;