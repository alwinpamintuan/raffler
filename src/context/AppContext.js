import React, {useState} from 'react';

const AppContext = React.createContext({
    entries: [],
    setEntries: () => {}
});

function AppContextProvider({children}){
    const [entries, setEntries] = useState([]);
    const appContext = {entries, setEntries};

    return(
        <AppContext.Provider value={appContext}>
            {children}
        </AppContext.Provider>
    )
}

export {AppContext, AppContextProvider}