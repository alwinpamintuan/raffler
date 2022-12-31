import { AppContextProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import Main from "./components/Main/Main";
import "./App.css";
import logo from "./assets/logowhite.png";

function App() {
  return (
    <AppContextProvider>
      <div className="app">
        <div id="header">
          <h1>RAFFLER</h1>
          <img src={logo} className="logo" />
          <a
            href="https://github.com/alwinpamintuan/raffler"
            target="_blank"
            rel="noreferrer"
            className="github"
          >
            GITHUB
          </a>
        </div>
        <div className="content">
          <Sidebar />
          <Main />
        </div>
      </div>
    </AppContextProvider>
  );
}

export default App;
