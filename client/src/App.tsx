import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import DebugSite from "./debug/DebugSite";
import AnalyticsBanner from "./platform/components/AnalyticsBanner";
import ReactGA from "react-ga";
import allGames from "./allGames";
import "./app.css";

let gameSiteMap = new Map();
allGames.forEach((gameConfig) => {
  gameSiteMap.set(
    gameConfig.gameID,
    lazy(() => import(`./games/${gameConfig.directory}/GameSite`))
  );
});

export default function App() {
  // 2.0: We assume that the component under <Switch> always unmounts, because
  // we close the socket in componentWillUnmount().
  return (
    <Router>
      <div>
        <nav className="topnav">
          <ul className="topnavlist">
            <li>
              <Link to="/">Home</Link>
            </li>
            {allGames.map((config) => (
              <li key={config.gameID}>
                <Link to={`/${config.directory}`}>{config.gameName}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <AnalyticsBanner />

        <Suspense fallback={<div>Loading</div>}>
          <Switch>
            {allGames.map((config) => (
              <Route
                key={config.gameID}
                path={`/${config.directory}`}
                component={gameSiteMap.get(config.gameID)}
              ></Route>
            ))}
            <Route path="/debug/:game/:numPlayers" component={DebugSite} />
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </Suspense>
      </div>
    </Router>
  );
}

function Home() {
  document.title = "Cupertino Grouperino";
  ReactGA.pageview("/");
  return (
    <div className="home">
      <h1 className="hometitle">Cupertino Grouperino</h1>
      <h2 className="homesubtitle">Board Game Platform</h2>
      <div className="homecontent">Pick a game to get started.</div>
      <table className="widget">
        <thead>
          <tr>
            <th>Game</th>
            <th>Num Players</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {allGames.map((config) => (
            <tr key={config.gameID}>
              <td>
                <Link to={`/${config.directory}`}>{config.gameName}</Link>
              </td>
              <td>{config.numPlayers}</td>
              <td>{config.category}</td>
              <td>{config.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
