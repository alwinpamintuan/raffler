import { AppContextProvider } from './context/AppContext';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import './App.css';

function App() {
  return (
    <AppContextProvider>
      <div className="App">
        <Sidebar/>
        <Main/>
      </div>
    </AppContextProvider>
  );
}

export default App;
