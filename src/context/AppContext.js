import React, {useState} from 'react';

const AppContext = React.createContext({
    entries: [],
    winners: [],
    setEntries: () => {},
    setWinners: () => {}
});

function AppContextProvider({children}){
    const [entries, setEntries] = useState([]);
    const [winners, setWinners] = useState([]);
    const appContext = {entries, setEntries, winners, setWinners};

    return(
        <AppContext.Provider value={appContext}>
            {children}
        </AppContext.Provider>
    )
}

export {AppContext, AppContextProvider}