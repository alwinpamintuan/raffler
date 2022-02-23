import { AppContextProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import EntriesContainer from './components/EntriesContainer';
import './App.css';

function App() {
  return (
    <AppContextProvider>
      <div className="App">
        <Sidebar/>
        <EntriesContainer/>
      </div>
    </AppContextProvider>
  );
}

export default App;