import React, {useContext, useEffect, useState} from 'react';
import {AppContext} from '../../context/AppContext';
import Home from '../Home/Home.js';
import RaffleDraw from '../RaffleDraw/RaffleDraw';
import './Main.css'

function Main(){
  const {entries} = useContext(AppContext);
  const [bg, setBg] = useState('--background-fore')
  
  useEffect(() => {
    if(entries.length === 0) setBg('--background-fore');
    else setBg(setBg('--background-main'));
  }, [entries])

  return(
    <div id="main" style={{backgroundColor: bg}}>{
      entries.length === 0
        ? <Home/>
        : <RaffleDraw/>
    }</div>
  )
}

export default Main;